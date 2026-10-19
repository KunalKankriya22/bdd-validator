import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil, finalize } from 'rxjs';
import { LabUserAccessService } from '../services/lab-user-access.service';
import { AttachedUser } from '../models/lab-user-access.model';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-view-attached-users-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './view-attached-users-panel.html',
  styleUrls: ['./view-attached-users-panel.scss']
})
export class ViewAttachedUsersPanelComponent implements OnChanges, OnDestroy {
  @Input() accessClass = '';
  @Input() description = '';
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  attachedUsers: AttachedUser[] = [];
  originalUsers: AttachedUser[] = [];
  displayedColumns: string[] = ['userId', 'name', 'level'];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  sortColumn: string | null = 'userId';
  sortDirection: 'asc' | 'desc' | null = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private labUserAccessService: LabUserAccessService,
    private headerService: HeaderService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Load attached users when panel opens or access class changes
    const isOpenChanged = changes['isOpen'];
    const accessClassChanged = changes['accessClass'];

    // Load if:
    // 1. Panel just opened (isOpen changed to true)
    // 2. Access class changed while panel is open
    // 3. First change and both isOpen and accessClass are set
    if (this.isOpen && this.accessClass) {
      if (
        (isOpenChanged && this.isOpen) ||
        (accessClassChanged && !accessClassChanged.firstChange) ||
        (isOpenChanged?.firstChange && accessClassChanged?.firstChange)
      ) {
        this.loadAttachedUsers();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAttachedUsers(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.labUserAccessService
      .getAttachedUsers(this.accessClass, this.headerService.getCurrentChapterId())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (users) => {
          this.originalUsers = [...users];
          this.attachedUsers = users;
          this.sortColumn = 'userId';
          this.sortDirection = 'asc';
          this.applySorting();
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = error.error?.message || 'Failed to load attached users';
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortColumn || !this.sortDirection) {
      this.attachedUsers = [...this.originalUsers];
      return;
    }

    this.attachedUsers = [...this.originalUsers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (this.sortColumn === 'userId') {
        aValue = a.userId;
        bValue = b.userId;
      } else if (this.sortColumn === 'name') {
        aValue = a.name || '';
        bValue = b.name || '';
      } else if (this.sortColumn === 'level') {
        aValue = a.level;
        bValue = b.level;
      }

      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue - bValue;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
}
