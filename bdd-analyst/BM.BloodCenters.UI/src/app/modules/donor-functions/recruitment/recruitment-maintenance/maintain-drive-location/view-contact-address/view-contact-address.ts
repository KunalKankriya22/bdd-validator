import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

interface AddressData {
  locationName: string;
  street: string;
  suitApt: string;
  city: string;
  state: string;
  zipCode: string;
  mapsco: string;
  county: string;
  phone: string;
  fax: string;
  email: string;
  web: string;
  notes: string;
}

@Component({
  selector: 'app-view-contact-address',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './view-contact-address.html',
  styleUrls: ['./view-contact-address.scss']
})
export class ViewContactAddressComponent implements OnInit, OnDestroy {
  @Input() locationId: string = '';
  @Input() address: AddressData | null = null;

  @Output() closePanel = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
