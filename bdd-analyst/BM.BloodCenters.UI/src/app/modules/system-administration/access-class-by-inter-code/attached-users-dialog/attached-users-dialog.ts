import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AccessClassByInterCodeService } from '../services/access-class-by-inter-code.service';
import { AccessClassUser } from '../models/access-class-by-inter-code.model';

export interface AttachedUsersDialogData {
  accessClass: string;
  description: string;
}

@Component({
  selector: 'app-attached-users-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    A11yModule
  ],
  templateUrl: './attached-users-dialog.html',
  styleUrls: ['./attached-users-dialog.scss']
})
export class AttachedUsersDialog implements OnInit, OnDestroy {
  @Input() data!: AttachedUsersDialogData;
  @Output() closePanel = new EventEmitter<void>();

  users: AccessClassUser[] = [];
  isLoading = false;
  sortDirection: 'ASC' | 'DESC' = 'ASC';
  private destroy$ = new Subject<void>();

  constructor(
    private service: AccessClassByInterCodeService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;

    this.service.getAttachedUsers(this.data.accessClass, this.sortDirection)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.users = response.data || [];
        },
        error: (error) => {
          console.error('Error loading attached users:', error);
          this.users = [];
        }
      });
  }

  toggleSort(column: string): void {
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.loadUsers();
  }

  getSortIcon(column: string): string {
    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  close(): void {
    this.closePanel.emit();
  }
}
