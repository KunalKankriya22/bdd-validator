import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { CustomerContractDto } from '../models/customer-contract.model';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-customer-contract-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './customer-contract-card.component.html',
  styleUrls: ['./customer-contract-card.component.scss']
})
export class CustomerContractCardComponent {
  private static nextId = 0;
  protected readonly componentId = `customer-contract-card-${CustomerContractCardComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private headerService = inject(HeaderService);

  @Input() contract!: CustomerContractDto;
  @Input() customerName: string = '';
  @Input() customerCity: string = '';
  @Output() edit = new EventEmitter<CustomerContractDto>();

  get isActive(): boolean {
    if (!this.contract?.termDate) return true;
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(this.contract.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  get statusClass(): string {
    return this.isActive ? 'status-active' : 'status-inactive';
  }

  get statusLabel(): string {
    return this.isActive ? 'Active' : 'Inactive';
  }

  get rotationDisplay(): string {
    if (!this.contract?.rotationFlag) return '--';
    return this.contract.rotationFlag === 'Y' ? 'Yes' : 'No';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '--';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '--';
    return value.toFixed(2);
  }

  onEdit(): void {
    this.edit.emit(this.contract);
  }
}
