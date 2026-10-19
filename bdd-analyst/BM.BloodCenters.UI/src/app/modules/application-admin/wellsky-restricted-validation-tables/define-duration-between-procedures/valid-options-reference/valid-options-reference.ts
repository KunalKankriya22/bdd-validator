import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DefineDurationBetweenProceduresService } from '../services/define-duration-between-procedures.service';
import { DonationType, ProcedureCode } from '../models/define-duration-between-procedures.model';

@Component({
  selector: 'app-valid-options-reference',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './valid-options-reference.html',
  styleUrls: ['./valid-options-reference.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidOptionsReference implements OnInit {
  @Output() close = new EventEmitter<void>();

  donationTypes: DonationType[] = [];
  procedureCodes: ProcedureCode[] = [];

  isLoadingDonationTypes = false;
  isLoadingProcedureCodes = false;
  hasErrorDonationTypes = false;
  hasErrorProcedureCodes = false;

  constructor(
    private defineDurationService: DefineDurationBetweenProceduresService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDonationTypes();
    this.loadProcedureCodes();
  }

  private loadDonationTypes(): void {
    this.isLoadingDonationTypes = true;
    this.hasErrorDonationTypes = false;

    this.defineDurationService.getDonationTypes().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.donationTypes = response.data;
        } else if (response.item && Array.isArray(response.item)) {
          this.donationTypes = response.item;
        } else {
          this.donationTypes = [];
        }

        this.isLoadingDonationTypes = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading donation types:', error);
        this.hasErrorDonationTypes = true;
        this.isLoadingDonationTypes = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadProcedureCodes(): void {
    this.isLoadingProcedureCodes = true;
    this.hasErrorProcedureCodes = false;

    this.defineDurationService.getProcedureCodes().subscribe({
      next: (response) => {
        console.log('Procedure Codes Response:', response);

        if (response.data && Array.isArray(response.data)) {
          this.procedureCodes = response.data;
        } else if (response.item && Array.isArray(response.item)) {
          this.procedureCodes = response.item;
        } else {
          this.procedureCodes = [];
        }

        this.isLoadingProcedureCodes = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading procedure codes:', error);
        this.hasErrorProcedureCodes = true;
        this.isLoadingProcedureCodes = false;
        this.cdr.markForCheck();
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
