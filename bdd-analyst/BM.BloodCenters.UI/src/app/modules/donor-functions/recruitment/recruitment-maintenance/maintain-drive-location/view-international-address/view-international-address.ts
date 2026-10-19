import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';

interface InternationalAddressData {
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  country: string;
  postalCode: string;
  workPhoneNumber: string;
  extension: string;
  homePhoneNumber: string;
  mobilePhoneNumber: string;
  fax: string;
  email: string;
}

@Component({
  selector: 'app-view-international-address',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './view-international-address.html',
  styleUrls: ['./view-international-address.scss']
})
export class ViewInternationalAddressComponent implements OnInit, OnDestroy {
  @Input() locationId: string = '';
  @Input() address: InternationalAddressData | null = null;

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
