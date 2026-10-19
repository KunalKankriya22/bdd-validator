import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccessClass, AttachedUser } from '../models/access-class.model';
import { ApiService } from '../../../../../../shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class AccessClassService {
    private apiService = inject(ApiService);

    // Mock implementation for access classes
    getAccessClasses(): Observable<AccessClass[]> {
        return of([
            {
                type: 'INTER',
                code: 'CAUTN',
                description: 'Manage donor caution flags',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Active'
            },
            {
                type: 'INTER',
                code: 'CAUTN',
                description: 'A for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '-',
                status: 'Inactive'
            },
            {
                type: 'INTER',
                code: 'CAUTN',
                description: 'TB for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '-',
                status: 'Active'
            },
            {
                type: 'PROPR',
                code: 'CAUTN',
                description: 'AB for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Active'
            },
            {
                type: 'PROPR',
                code: 'TVIEW',
                description: 'B for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Inactive'
            },
            {
                type: 'PROPR',
                code: 'TVIEW',
                description: 'C for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Inactive'
            },
            {
                type: 'PROPR',
                code: 'TVIEW',
                description: 'D for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Inactive'
            },
            {
                type: 'PROPR',
                code: 'TVIEW',
                description: 'E for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Inactive'
            },
            {
                type: 'PROPR',
                code: 'TVIEW',
                description: 'E for Function 1.01',
                effectiveDate: '02-NOV-2025',
                terminationDate: '10-DEC-2025',
                status: 'Inactive'
            }
        ]);
    }

    getAttachedUsers(accessClass: string): Observable<AttachedUser[]> {
        const endpoint = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ATTACHED_USERS(accessClass);
        return this.apiService.get<ApiResponse<AttachedUser[]>>(endpoint).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching attached users:', error);
                return throwError(() => error);
            })
        );
    }

    searchAccessClasses(searchTerm: string): Observable<AccessClass[]> {
        // In real implementation, this would call an API
        return this.getAccessClasses();
    }
}
