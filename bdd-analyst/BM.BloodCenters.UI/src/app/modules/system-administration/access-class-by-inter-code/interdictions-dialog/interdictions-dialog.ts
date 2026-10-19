import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AccessClassByInterCodeService } from '../services/access-class-by-inter-code.service';
import { AccessClassInterdiction } from '../models/access-class-by-inter-code.model';

export interface InterdictionsDialogData {
  accessClass: string;
  description: string;
}

@Component({
  selector: 'app-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    A11yModule
  ],
  templateUrl: './interdictions-dialog.html',
  styleUrls: ['./interdictions-dialog.scss']
})
export class InterdictionsDialog implements OnInit, OnDestroy {
  @Input() data!: InterdictionsDialogData;
  @Output() closePanel = new EventEmitter<void>();

  interdictions: AccessClassInterdiction[] = [];
  isLoading = false;
  hasError = false;
  sortDirection: 'ASC' | 'DESC' = 'ASC';
  private destroy$ = new Subject<void>();

  constructor(
    private service: AccessClassByInterCodeService
  ) {}

  ngOnInit(): void {
    this.loadInterdictions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInterdictions(): void {
    this.isLoading = true;
    this.hasError = false;

    this.service.getInterdictions(this.data.accessClass, this.sortDirection)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.interdictions = response.data || [];
          this.hasError = false;
        },
        error: (error) => {
          console.error('Error loading interdictions:', error);
          this.interdictions = [];
          this.hasError = true;
        }
      });
  }

  toggleSort(column: string): void {
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.loadInterdictions();
  }

  getSortIcon(column: string): string {
    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  close(): void {
    this.closePanel.emit();
  }
}

