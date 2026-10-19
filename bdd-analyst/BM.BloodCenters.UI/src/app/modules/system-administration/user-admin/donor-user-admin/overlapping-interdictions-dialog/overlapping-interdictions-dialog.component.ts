import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil, finalize } from 'rxjs';
import { UserAccessService } from '../services/user-access.service';
import { OverlappingInterdictionDto } from '../models/user-access.model';

export interface OverlappingInterdictionsDialogData {
  userId: string;
}

@Component({
  selector: 'app-overlapping-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './overlapping-interdictions-dialog.component.html',
  styleUrls: ['./overlapping-interdictions-dialog.component.scss']
})
export class OverlappingInterdictionsDialogComponent implements OnInit, OnDestroy {
  interdictions: OverlappingInterdictionDto[] = [];
  originalInterdictions: OverlappingInterdictionDto[] = [];
  displayedColumns: string[] = ['code', 'description', 'accessClasses'];
  isLoading = false;

  sortColumn: string | null = 'code';
  sortDirection: 'asc' | 'desc' | null = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<OverlappingInterdictionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OverlappingInterdictionsDialogData,
    private userAccessService: UserAccessService
  ) {}

  ngOnInit(): void {
    if (this.data?.userId) {
      this.loadOverlappingInterdictions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOverlappingInterdictions(): void {
    this.isLoading = true;
    this.userAccessService
      .getOverlappingInterdictions(this.data.userId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.originalInterdictions = data;
          this.interdictions = [...data];
          this.applySorting();
        },
        error: () => {
          this.originalInterdictions = [];
          this.interdictions = [];
        }
      });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortColumn || !this.sortDirection) {
      this.interdictions = [...this.originalInterdictions];
      return;
    }

    const col = this.sortColumn as 'code' | 'description';
    const dir = this.sortDirection;
    this.interdictions = [...this.originalInterdictions].sort((a, b) => {
      const aValue = a[col] ?? '';
      const bValue = b[col] ?? '';
      const comparison = aValue.localeCompare(bValue);
      return dir === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column || !this.sortDirection) {
      return 'arrow_downward';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
