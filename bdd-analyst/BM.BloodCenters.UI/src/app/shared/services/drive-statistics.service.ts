import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../core/constants/api.constants';
import {
  DriveStatisticsResponse,
  DriveStatisticsItem,
} from '@shared/models/drive-statistics.model';

@Injectable({
  providedIn: 'root',
})
export class DriveStatisticsService {
  private readonly apiService = inject(ApiService);

  getDriveStatistics(driveId: string, chapterId: string): Observable<DriveStatisticsItem> {
    return this.apiService
      .get<DriveStatisticsResponse>(API.RECRUITMENT.DRIVE_STATISTICS.GET(driveId, chapterId))
      .pipe(map((response) => response?.item ?? this.emptyItem(driveId, chapterId)));
  }

  private emptyItem(driveId: string, chapterId: string): DriveStatisticsItem {
    return {
      header: {
        driveId,
        chapterId,
        totalDonations: 0,
        driveDate: '',
        driveType: '',
        typeDescription: '',
        sponsorId: '',
        sponsorName: '',
        projectedShow: null,
        projectedDraw: null,
        projectedDeferralRate: null,
        actualDraw: 0,
        actualDeferral: 0,
        deferralRate: null,
      },
      donations: [],
      venipuncture: [],
      deferrals: { allogenic: [], autologousTherapeutic: [] },
      unitDetails: [],
      donorsList: [],
    };
  }
}
