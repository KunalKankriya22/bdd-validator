import { Component, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DonorListItem, DonorsFilterValue } from '../../../models/interdiction-query.model';
import { DonorsFilterPanelComponent } from '../donors-filter-panel/donors-filter-panel.component';

@Component({
  selector: 'app-donor-list-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    OverlayModule,
    SearchBar,
    DonorsFilterPanelComponent
  ],
  templateUrl: './donor-list-panel.component.html',
  styleUrls: ['./donor-list-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorListPanelComponent {
  donors = input<DonorListItem[]>([]);
  selectedDonor = input<DonorListItem | null>(null);
  currentFilters = input<DonorsFilterValue | null>(null);

  @Output() donorSelected = new EventEmitter<DonorListItem>();
  @Output() demographics = new EventEmitter<string>();
  @Output() donations = new EventEmitter<string>();
  @Output() attributes = new EventEmitter<string>();
  @Output() otherInterdictions = new EventEmitter<string>();
  @Output() filterApply = new EventEmitter<DonorsFilterValue>();

  private cdr = inject(ChangeDetectorRef);
  searchText = signal<string>('');
  isFilterOpen = false;
  filterPanelPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 0, offsetY: 4 }
  ];

  filteredDonors = computed(() => {
    const donors = this.donors();
    const search = this.searchText().toLowerCase();
    if (!search) {
      return donors;
    }
    return donors.filter(d =>
      d.donorId.toLowerCase().includes(search) ||
      `${d.lastName}, ${d.firstName}`.toLowerCase().includes(search) ||
      d.lastName.toLowerCase().includes(search) ||
      d.firstName.toLowerCase().includes(search)
    );
  });

  onSearch(searchTerm: string): void {
    this.searchText.set(searchTerm);
  }

  onSelectDonor(donor: DonorListItem): void {
    this.donorSelected.emit(donor);
  }

  onDemographics(donorId: string): void {
    this.demographics.emit(donorId);
  }

  onDonations(donorId: string): void {
    this.donations.emit(donorId);
  }

  onAttributes(donorId: string): void {
    this.attributes.emit(donorId);
  }

  onOtherInterdictions(donorId: string): void {
    this.otherInterdictions.emit(donorId);
  }

  isSelected(donor: DonorListItem): boolean {
    return this.selectedDonor()?.donorId === donor.donorId;
  }

  getGenderClass(gender: string): string {
    return gender?.toUpperCase() === 'M' ? 'gender-male' : 'gender-female';
  }

  getGenderIcon(gender: string): string {
    return gender?.toUpperCase() === 'M'
      ? '/assets/images/People/Male.svg'
      : '/assets/images/People/Female.svg';
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
    this.cdr.markForCheck();
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    this.cdr.markForCheck();
  }

  onFilterApply(filters: DonorsFilterValue): void {
    this.filterApply.emit(filters);
    this.closeFilterPanel();
  }

  onFilterClear(): void {
    this.filterApply.emit({ showTerminated: false, sex: '' });
    this.closeFilterPanel();
  }

  onListKeydown(event: KeyboardEvent): void {
    const donors = this.filteredDonors();
    if (donors.length === 0) return;

    const currentIndex = donors.findIndex(d => this.isSelected(d));
    let newIndex = currentIndex;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = currentIndex < donors.length - 1 ? currentIndex + 1 : 0;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : donors.length - 1;
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = donors.length - 1;
    } else {
      return;
    }

    this.onSelectDonor(donors[newIndex]);
    const container = event.currentTarget as HTMLElement;
    const options = container.querySelectorAll('[role="option"]');
    (options[newIndex] as HTMLElement)?.focus();
  }
}
