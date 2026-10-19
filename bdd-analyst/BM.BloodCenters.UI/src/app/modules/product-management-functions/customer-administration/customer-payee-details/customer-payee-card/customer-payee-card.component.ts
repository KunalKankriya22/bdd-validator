import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import moment from 'moment';

import { PayeeCustomerDto } from '../models/customer-payee.model';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-customer-payee-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-payee-card.component.html',
  styleUrls: ['./customer-payee-card.component.scss']
})
export class CustomerPayeeCardComponent {
  private static nextId = 0;
  protected readonly componentId = `customer-payee-card-${CustomerPayeeCardComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private headerService = inject(HeaderService);

  @Input() payee!: PayeeCustomerDto;
  @Input() customerName: string = '';
  @Input() customerCity: string = '';
  @Output() edit = new EventEmitter<PayeeCustomerDto>();

  get isActive(): boolean {
    if (!this.payee?.termDate) return true;
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(this.payee.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  get statusClass(): string {
    return this.isActive ? 'status-active' : 'status-inactive';
  }

  get statusLabel(): string {
    return this.isActive ? 'Active' : 'Inactive';
  }

  get fullAddress(): string {
    const parts = [this.payee.address1];
    if (this.payee.address2) parts.push(this.payee.address2);
    if (this.payee.address3) parts.push(this.payee.address3);
    const cityState = [this.payee.city, this.payee.state].filter(Boolean).join(', ');
    const cityStateZip = [cityState, this.payee.zip].filter(Boolean).join(' ');
    parts.push(cityStateZip);
    if (this.payee.country) parts.push(this.payee.country);
    return parts.join(', ');
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }

  onEdit(): void {
    this.edit.emit(this.payee);
  }
}
