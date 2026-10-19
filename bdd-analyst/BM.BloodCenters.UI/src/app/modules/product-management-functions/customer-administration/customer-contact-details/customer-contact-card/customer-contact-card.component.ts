import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { CustomerContactDto } from '../models/customer-contact.model';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-customer-contact-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-contact-card.component.html',
  styleUrls: ['./customer-contact-card.component.scss']
})
export class CustomerContactCardComponent {
  private static nextId = 0;
  protected readonly componentId = `customer-contact-card-${CustomerContactCardComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private headerService = inject(HeaderService);

  @Input() contact!: CustomerContactDto;
  @Input() customerName: string = '';
  @Output() edit = new EventEmitter<CustomerContactDto>();

  get isActive(): boolean {
    if (!this.contact?.termDate) return true;
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(this.contact.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  get statusClass(): string {
    return this.isActive ? 'status-active' : 'status-inactive';
  }

  get statusLabel(): string {
    return this.isActive ? 'Active' : 'Inactive';
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

  onEdit(): void {
    this.edit.emit(this.contact);
  }
}
