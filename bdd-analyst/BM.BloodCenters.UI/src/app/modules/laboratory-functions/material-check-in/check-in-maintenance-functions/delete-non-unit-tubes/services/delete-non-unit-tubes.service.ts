import { Injectable, inject } from '@angular/core';
import { Observable, map, of, delay } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import {
  NonUnitTubeDto,
  DeleteNonUnitTubesResponse,
  DeleteNonUnitTubesDeleteRequest,
} from '../models/delete-non-unit-tubes.model';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T[];
  item?: T;
  totalCount?: number;
}

@Injectable({ providedIn: 'root' })
export class DeleteNonUnitTubesService {
  private readonly apiService = inject(ApiService);

  // TEMPORARY: Dummy data for testing until backend is ready
  private readonly DUMMY_DATA: NonUnitTubeDto[] = [
    { unitId: 'W12342402705-Q', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T08:15:30' },
    { unitId: 'W12342402705-D', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T09:22:15' },
    { unitId: 'W12342402705-Y', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T10:45:00' },
    { unitId: 'W12342402705-W', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T11:30:45' },
    { unitId: 'W12342402705-W', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T13:10:20' },
    { unitId: 'W12342402705-W', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T14:55:10' },
    { unitId: 'W12342402705-W', chapterId: 'AAD', tubeCheckinDats: '2025-01-11T16:20:35' },
    { unitId: 'ABC1234567890', chapterId: 'AAD', tubeCheckinDats: '2025-01-12T07:40:00' },
    { unitId: 'XYZ9876543210', chapterId: 'AAD', tubeCheckinDats: '2025-01-12T09:15:22' },
    { unitId: 'TEST12345678-A', chapterId: 'AAD', tubeCheckinDats: '2025-01-12T11:05:18' },
    { unitId: 'SAMPLE123456-B', chapterId: 'AAD', tubeCheckinDats: '2025-01-13T08:30:00' },
    { unitId: 'UNIT1234567890', chapterId: 'AAD', tubeCheckinDats: '2025-01-13T10:15:45' },
    { unitId: 'W12342402705-Z', chapterId: 'AAD', tubeCheckinDats: '2025-01-14T12:45:30' },
    { unitId: 'DEMO12345678-C', chapterId: 'AAD', tubeCheckinDats: '2025-01-14T14:20:15' },
    { unitId: 'PROD12345678-E', chapterId: 'AAD', tubeCheckinDats: '2025-01-15T09:05:00' },
  ];

  private readonly USE_DUMMY_DATA = false; // Backend deployed and working (PR #1369)

  /**
   * Get tubes checked in within the specified date range
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Observable of tube data with total count
   */
  getTubes(startDate: string, endDate: string): Observable<DeleteNonUnitTubesResponse> {
    // TEMPORARY: Use dummy data until backend is ready
    if (this.USE_DUMMY_DATA) {
      return this.getDummyTubes(startDate, endDate);
    }

    const payload = { startDate, endDate };

    return this.apiService
      .post<any>(
        API.DELETE_NON_UNIT_TUBES.GET_TUBES,
        payload
      )
      .pipe(
        map(res => {
          const tubes: NonUnitTubeDto[] = (res.data?.tubes ?? []) as NonUnitTubeDto[];

          return {
            data: tubes,
            totalCount: res.data?.totalCount ?? 0,
            message: res.message,
            errorCode: res.errorCode,
            success: res.success
          } as any;
        })
      );
  }

  /**
   * Delete selected tubes
   * @param unitIds Array of unit IDs to delete
   * @returns Observable indicating success
   */
  deleteTubes(unitIds: string[]): Observable<{ success: boolean; message?: string }> {
    // TEMPORARY: Use dummy deletion until backend is ready
    if (this.USE_DUMMY_DATA) {
      return this.deleteDummyTubes(unitIds);
    }

    const payload: DeleteNonUnitTubesDeleteRequest = { unitIds };

    return this.apiService
      .delete<ApiResponse<unknown>>(
        API.DELETE_NON_UNIT_TUBES.DELETE_TUBES,
        { body: payload }
      )
      .pipe(
        map(res => ({
          success: res.success === true,
          message: res.message,
        }))
      );
  }

  /**
   * TEMPORARY: Simulate getting tubes with dummy data
   * Remove this method when backend is ready
   */
  private getDummyTubes(startDate: string, endDate: string): Observable<DeleteNonUnitTubesResponse> {
    // Parse date strings to Date objects for comparison
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Filter dummy data by date range
    const filtered = this.DUMMY_DATA.filter(item => {
      const itemDate = new Date(item.tubeCheckinDats);
      return itemDate >= start && itemDate <= end;
    });

    // Simulate network delay
    return of({
      data: filtered,
      totalCount: filtered.length
    }).pipe(delay(800));
  }

  /**
   * TEMPORARY: Simulate deleting tubes with dummy data
   * Remove this method when backend is ready
   */
  private deleteDummyTubes(unitIds: string[]): Observable<{ success: boolean; message?: string }> {
    // Simulate network delay
    return of({
      success: true,
      message: `${unitIds.length} tube(s) deleted successfully`
    }).pipe(delay(600));
  }
}
