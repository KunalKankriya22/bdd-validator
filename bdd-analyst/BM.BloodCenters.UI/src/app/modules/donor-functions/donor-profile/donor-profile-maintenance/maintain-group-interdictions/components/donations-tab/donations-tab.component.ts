import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import moment from 'moment';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { SelectInterdictionsDialogComponent } from '../select-interdictions-dialog/select-interdictions-dialog.component';
import { RemoveInterdictionDialogComponent } from '../remove-interdiction-dialog/remove-interdiction-dialog.component';
import {
  GroupInterdictionLookupDto,
  DonationUnit,
  GroupInterdictionParams,
  SelectableInterdiction,
  PlaceInterdictionResponse,
  RemoveInterdictionResponse,
  GROUP_MODE_OPTIONS,
  RemoveInterdictionDialogData,
  RemoveInterdictionDialogResult
} from '../../models/maintain-group-interdictions.model';

@Component({
  selector: 'app-donations-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    SearchBar,
    SelectInterdictionsDialogComponent
  ],
  templateUrl: './donations-tab.component.html',
  styleUrls: ['./donations-tab.component.scss']
})
export class DonationsTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainGroupInterdictionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);

  controlForm!: FormGroup;
  valueSearchControl = new FormControl<string>('');
  filteredValueOptions = signal<GroupInterdictionLookupDto[]>([]);
  readonly fallbackModeOptions = GROUP_MODE_OPTIONS;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 0,
    ariaLabel: 'Search by interdiction code or description',
    debounceTime: 300,
    searchOnEnterOnly: false
  };

  modeOptions = signal<GroupInterdictionLookupDto[]>([]);
  valueOptions = signal<GroupInterdictionLookupDto[]>([]);
  units = signal<DonationUnit[]>([]);
  interdictions = signal<GroupInterdictionLookupDto[]>([]);
  isLoading = signal<boolean>(false);
  hasRetrieved = signal<boolean>(false);
  searchText = signal<string>('');
  modeDescription = signal<string>('');
  unitSortDirection = signal<'asc' | 'desc'>('asc');
  interdictionSortDirection = signal<'asc' | 'desc'>('asc');

  showSelectPanel = false;
  selectPanelExistingCodes: string[] = [];
  selection = new SelectionModel<GroupInterdictionLookupDto>(true, []);
  selectedCount = signal(0);

  filteredInterdictions = computed(() => {
    const search = this.searchText().toLowerCase();
    const items = this.interdictions();
    const sorted = [...items].sort((a, b) => {
      const cmp = a.code.localeCompare(b.code);
      return this.interdictionSortDirection() === 'asc' ? cmp : -cmp;
    });
    if (!search) return sorted;
    return sorted.filter(item =>
      (item.code || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search)
    );
  });

  sortedUnits = computed(() => {
    const items = this.units();
    return [...items].sort((a, b) => {
      const cmp = (a.unitId || '').localeCompare(b.unitId || '');
      return this.unitSortDirection() === 'asc' ? cmp : -cmp;
    });
  });

  ngOnInit(): void {
    this.controlForm = this.fb.group({
      mode: ['', Validators.required],
      value: ['', Validators.required]
    });

    this.controlForm.get('mode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode: string) => {
        this.onModeChange(mode);
      });

    this.setupValueSearch();
    this.loadGroupModes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onModeChange(mode: string): void {
    const modeOption = this.modeOptions().find(m => m.code === mode);
    this.modeDescription.set(modeOption?.description || '');
    const valueControl = this.controlForm.get('value');
    valueControl?.reset('');
    valueControl?.markAsUntouched();
    valueControl?.markAsPristine();
    this.valueSearchControl.setValue('');
    this.resetResults();
    this.loadValueOptions(mode);
  }

  onRetrieve(): void {
    if (this.controlForm.invalid) {
      this.controlForm.markAllAsTouched();
      return;
    }

    const params = this.buildParams();
    this.isLoading.set(true);
    this.interdictions.set([]);
    this.units.set([]);

    this.service.retrieveDonations(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donationsResponse) => {
          this.units.set(donationsResponse.donations);
          this.hasRetrieved.set(true);
          this.isLoading.set(false);

          if (donationsResponse.donations.length === 0) {
            this.showErrorMessage('No donations found for the selected criteria.');
          } else {
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
      context: 'donation'
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

  toggleUnitSort(): void {
    this.unitSortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  toggleInterdictionSort(): void {
    this.interdictionSortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  formatDate(dateStr: string): string {
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

    this.service.placeInterdictions({
      groupMode: params.groupMode,
      groupValue: params.groupValue,
      interCodes: codes,
      commit: true
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PlaceInterdictionResponse) => {
          this.isLoading.set(false);
          if (response.failureCount === 0) {
            this.showSuccessMessage(
              `Interdictions placed successfully. ${response.successCount} of ${response.totalUnits} unit(s) processed.`
            );
          } else if (response.successCount > 0 && response.failureCount > 0) {
            // Partial failure - show detailed message
            this.showPersistentErrorMessage(
              `Partial success: ${response.successCount} of ${response.totalUnits} interdiction(s) placed successfully, ${response.failureCount} failed. Check individual unit results for details.`
            );
          } else {
            // Complete failure
            this.showErrorMessage(
              `Failed to place interdictions. ${response.failureCount} of ${response.totalUnits} unit(s) failed.`
            );
          }
          this.refreshInterdictions();
        },
        error: () => {
          this.isLoading.set(false);
          this.showErrorMessage('Failed to place interdictions. Please try again.');
        }
      });
  }

  private removeInterdictions(codes: string[], reasonCode: string): void {
    const params = this.buildParams();
    this.isLoading.set(true);

    this.service.removeInterdictions({
      groupMode: params.groupMode,
      groupValue: params.groupValue,
      interCodes: codes,
      termReason: reasonCode,
      commit: true
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RemoveInterdictionResponse) => {
          this.isLoading.set(false);
          if (response.failureCount === 0) {
            this.showSuccessMessage(
              `Interdiction(s) removed successfully. ${response.successCount} of ${response.totalUnits} unit(s) processed.`
            );
          } else if (response.successCount > 0 && response.failureCount > 0) {
            this.showPersistentErrorMessage(
              `Partial success: ${response.successCount} of ${response.totalUnits} interdiction(s) removed successfully, ${response.failureCount} failed. Check individual unit results for details.`
            );
          } else {
            this.showErrorMessage(
              `Failed to remove interdictions. ${response.failureCount} of ${response.totalUnits} unit(s) failed.`
            );
          }
          this.clearSelection();
          this.refreshInterdictions();
        },
        error: () => {
          this.isLoading.set(false);
          this.showErrorMessage('Failed to remove interdiction(s). Please try again.');
        }
      });
  }

  private loadExistingInterdictions(params: GroupInterdictionParams): void {
    this.service.getExistingInterCodes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.clearSelection();
          this.interdictions.set(interdictions);
        },
        error: () => this.interdictions.set([])
      });
  }

  private refreshInterdictions(): void {
    this.loadExistingInterdictions(this.buildParams());
  }

  private buildParams(): GroupInterdictionParams {
    return {
      groupMode: this.controlForm.get('mode')?.value,
      groupValue: this.controlForm.get('value')?.value
    };
  }

  private loadGroupModes(): void {
    this.service.getGroupModes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modes) => this.modeOptions.set(modes),
        error: () => this.modeOptions.set(this.fallbackModeOptions)
      });
  }

  private loadValueOptions(mode: string): void {
    this.service.getValuesByMode(mode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => {
          this.valueOptions.set(values);
          this.filteredValueOptions.set(values);
        },
        error: () => {
          this.valueOptions.set([]);
          this.filteredValueOptions.set([]);
        }
      });
  }

  private setupValueSearch(): void {
    this.valueSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredValueOptions.set(this.filterValues(search));
      });
  }

  private filterValues(search: string | null): GroupInterdictionLookupDto[] {
    if (!search || search.length === 0) {
      return this.valueOptions();
    }
    const searchLower = search.toLowerCase();
    return this.valueOptions().filter(v =>
      (v.code || '').toLowerCase().includes(searchLower) ||
      (v.description || '').toLowerCase().includes(searchLower)
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.controlForm.reset({ mode: '', value: '' });
        this.modeDescription.set('');
        this.valueOptions.set([]);
        this.filteredValueOptions.set([]);
        this.valueSearchControl.setValue('');
        this.showSelectPanel = false;
        this.resetResults();
        this.loadGroupModes();
      });
  }

  private resetResults(): void {
    this.units.set([]);
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
