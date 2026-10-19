import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import {
  SelectableInterdiction,
  GroupInterdictionLookupDto
} from '../../models/maintain-group-interdictions.model';

@Component({
  selector: 'app-select-interdictions-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    SidePanelBase,
    SearchBar
  ],
  templateUrl: './select-interdictions-dialog.component.html',
  styleUrls: ['./select-interdictions-dialog.component.scss']
})
export class SelectInterdictionsDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly service = inject(MaintainGroupInterdictionsService);

  @Input() existingCodes: string[] = [];
  @Input() context: 'donation' | 'donor' = 'donation';
  @Output() closePanel = new EventEmitter<void>();
  @Output() interdictionsSelected = new EventEmitter<SelectableInterdiction[]>();

  interdictionTypeControl = new FormControl<string>('');
  typeSearchControl = new FormControl<string>('');

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by interdiction code or description',
    minLength: 3,
    ariaLabel: 'Search by interdiction code or description',
    debounceTime: 300,
    searchOnEnterOnly: true
  };

  interdictionTypes = signal<GroupInterdictionLookupDto[]>([]);
  filteredTypes = signal<GroupInterdictionLookupDto[]>([]);
  allInterdictions = signal<SelectableInterdiction[]>([]);
  isLoading = signal<boolean>(false);
  selectedTypeDescription = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  searchText = signal<string>('');

  footerButtons: DialogButton[] = [
    { label: 'CANCEL', action: 'cancel', variant: 'text' },
    { label: 'ADD', action: 'add', variant: 'primary', disabled: true }
  ];

  filteredInterdictions = computed(() => {
    const searchTerm = this.searchText().toLowerCase();
    const items = this.allInterdictions();
    const sorted = [...items].sort((a, b) => {
      const cmp = (a.interCode || '').localeCompare(b.interCode || '');
      return this.sortDirection() === 'asc' ? cmp : -cmp;
    });
    if (!searchTerm) return sorted;
    return sorted.filter(item =>
      (item.interCode || '').toLowerCase().includes(searchTerm) ||
      (item.interDesc || '').toLowerCase().includes(searchTerm)
    );
  });

  isAllSelected = computed(() => {
    const items = this.filteredInterdictions();
    return items.length > 0 && items.every(item => item.selected);
  });

  isSomeSelected = computed(() => {
    const items = this.filteredInterdictions();
    return items.some(item => item.selected) && !this.isAllSelected();
  });

  hasSelections = computed(() => {
    return this.allInterdictions().some(item => item.selected);
  });

  ngOnInit(): void {
    this.loadInterdictionTypes();
    this.setupTypeSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTypeChange(typeCode: string): void {
    const selectedType = this.interdictionTypes().find(t => t.code === typeCode);
    this.selectedTypeDescription.set(selectedType?.description || '');
    this.loadAvailableInterdictions(typeCode);
  }

  onSearchChange(searchTerm: string): void {
    this.searchText.set(searchTerm);
  }

  onSearchCleared(): void {
    this.searchText.set('');
  }

  toggleSort(): void {
    this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  toggleRow(interdiction: SelectableInterdiction): void {
    this.allInterdictions.update(items =>
      items.map(item =>
        item.interCode === interdiction.interCode
          ? { ...item, selected: !item.selected }
          : item
      )
    );
    this.updateFooterButtonState();
  }

  toggleAll(): void {
    const allSelected = this.isAllSelected();
    const visibleCodes = new Set(this.filteredInterdictions().map(i => i.interCode));
    this.allInterdictions.update(items =>
      items.map(item =>
        visibleCodes.has(item.interCode)
          ? { ...item, selected: !allSelected }
          : item
      )
    );
    this.updateFooterButtonState();
  }

  onButtonClick(action: string): void {
    if (action === 'add') {
      this.onAdd();
    } else if (action === 'cancel') {
      this.onCancel();
    }
  }

  onAdd(): void {
    const selected = this.allInterdictions().filter(item => item.selected);
    this.interdictionsSelected.emit(selected);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private updateFooterButtonState(): void {
    this.footerButtons = this.footerButtons.map(btn =>
      btn.action === 'add' ? { ...btn, disabled: !this.hasSelections() } : btn
    );
  }

  private setupTypeSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredTypes.set(this.filterTypes(search));
      });
  }

  private filterTypes(search: string | null): GroupInterdictionLookupDto[] {
    if (!search || search.length === 0) {
      return this.interdictionTypes();
    }
    const searchLower = search.toLowerCase();
    return this.interdictionTypes().filter(t =>
      t.code.toLowerCase().includes(searchLower) ||
      (t.description || '').toLowerCase().includes(searchLower)
    );
  }

  private loadInterdictionTypes(): void {
    const serviceCall = this.context === 'donor'
      ? this.service.getDonorInterTypes()
      : this.service.getInterTypes();

    serviceCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.interdictionTypes.set(types);
          this.filteredTypes.set(types);
        },
        error: () => {
          this.interdictionTypes.set([]);
          this.filteredTypes.set([]);
        }
      });
  }

  private loadAvailableInterdictions(typeCode: string): void {
    this.isLoading.set(true);

    const serviceCall = this.context === 'donor'
      ? this.service.getValidDonorInterdictions(typeCode)
      : this.service.getValidInterdictions(typeCode);

    serviceCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          const existingCodes = new Set(this.existingCodes);
          const filtered = interdictions.filter(i => !existingCodes.has(i.interCode));
          this.allInterdictions.set(filtered);
          this.isLoading.set(false);
        },
        error: () => {
          this.allInterdictions.set([]);
          this.isLoading.set(false);
        }
      });
  }
}
