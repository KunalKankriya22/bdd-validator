import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AttachedUser, AttachedUsersResponse } from '../models/access-class.model';
import { AccessClassService } from '../services/access-class.service';

@Component({
  selector: 'app-attached-users-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './attached-users-dialog.html',
  styleUrls: ['./attached-users-dialog.scss']
})
export class AttachedUsersDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<AttachedUser>([]);
  displayedColumns: string[] = [
    'userId',
    'name',
    'level',
    'effectiveDate',
    'terminationDate'
  ];

  dialogTitle = 'Attached Users List';
  dialogSubtitle = '';
  sortDirection: 'default' | 'asc' | 'desc' = 'default';
  private originalData: AttachedUser[] = [];

  constructor(
    private dialogRef: MatDialogRef<AttachedUsersDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      accessClass: string;
      scope: string;
    },

    private accessClassService: AccessClassService
  ) {}

  ngOnInit(): void {
    this.dialogSubtitle = this.data.scope;
    this.loadAttachedUsers(this.data.accessClass);
  }

  toggleSort(): void {
    if (this.sortDirection === 'default') {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'default';
    }

    if (this.sortDirection === 'default') {
      this.dataSource.data = [...this.originalData];
      return;
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;
    this.dataSource.data = [...this.dataSource.data].sort((a, b) =>
      (a.userId || '').localeCompare(b.userId || '', undefined, { sensitivity: 'base' }) * dir
    );
  }

  loadAttachedUsers(accessClass: string): void {
    this.accessClassService
      .getAttachedUsers(accessClass)
      .subscribe({
        next: (res: AttachedUser[] | AttachedUsersResponse) => {
          console.log('Raw API response:', res);

          // Handle wrapped responses
          if (Array.isArray(res)) {
            this.originalData = res;
            this.dataSource.data = res;
          } else {
            this.originalData = res?.items ?? res?.data ?? [];
            this.dataSource.data = [...this.originalData];
          }
        },
        error: (err) => {
          console.error('Failed to load attached users', err);
          this.dataSource.data = [];
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
