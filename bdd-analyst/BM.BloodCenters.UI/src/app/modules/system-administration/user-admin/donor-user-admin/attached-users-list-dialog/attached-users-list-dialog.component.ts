import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AccessClassService } from './services/access-class.service';
import { AttachedUser } from './models/access-class.model';

export interface AttachedUsersDialogData {
    accessClass: string;
    description?: string;
}

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
    templateUrl: './attached-users-list-dialog.component.html',
    styleUrls: ['./attached-users-list-dialog.component.scss']
})
export class AttachedUsersListDialogComponent implements OnInit {
    attachedUsers: AttachedUser[] = [];
    originalUsers: AttachedUser[] = [];
    displayedColumns: string[] = ['userId', 'name', 'level'];
    dialogTitle = 'Attached Users List';
    dialogSubtitle = 'ALL - All Interdictions';

    sortColumn: string | null = null;
    sortDirection: 'asc' | 'desc' | null = null;

    constructor(
        private dialogRef: MatDialogRef<AttachedUsersListDialogComponent>,
        private accessClassService: AccessClassService,
        @Inject(MAT_DIALOG_DATA) public data: AttachedUsersDialogData
    ) { }

    ngOnInit(): void {
        if (this.data?.accessClass && this.data?.description) {
            this.dialogSubtitle = `${this.data.accessClass} | ${this.data.description}`;
        } else if (this.data?.accessClass) {
            this.dialogSubtitle = this.data.accessClass;
        }
        this.loadAttachedUsers();
    }

    loadAttachedUsers(): void {
        if (!this.data?.accessClass) {
            console.error('No access class provided');
            return;
        }

        this.accessClassService.getAttachedUsers(this.data.accessClass).subscribe({
            next: (users) => {
                this.attachedUsers = users;
                this.originalUsers = [...users];
                // Set default sort to userId ascending
                this.sortColumn = 'userId';
                this.sortDirection = 'asc';
                this.applySorting();
            },
            error: (error) => {
                console.error('Failed to load attached users:', error);
            }
        });
    }

    onSort(column: string): void {
        if (this.sortColumn === column) {
            // Cycle through: asc -> desc -> null
            if (this.sortDirection === 'asc') {
                this.sortDirection = 'desc';
            } else if (this.sortDirection === 'desc') {
                this.sortDirection = null;
                this.sortColumn = null;
            } else {
                this.sortDirection = 'asc';
            }
        } else {
            // New column, start with ascending
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.applySorting();
    }

    private applySorting(): void {
        if (!this.sortColumn || !this.sortDirection) {
            // Reset to original order
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
        if (this.sortColumn !== column || !this.sortDirection) {
            return 'arrow_downward';
        }
        return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    openAttachedUsersDialog(): void {
        this.loadAttachedUsers();
    }
}
