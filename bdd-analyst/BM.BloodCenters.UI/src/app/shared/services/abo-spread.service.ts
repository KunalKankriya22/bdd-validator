import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';

export interface AboSpreadRow {
  procedureCode: string;
  procedureCodeDescription: string;
  total: number;
  oPos: number;
  oNeg: number;
  aPos: number;
  aNeg: number;
  bPos: number;
  bNeg: number;
  abPos: number;
  abNeg: number;
  unknown: number;
}

export interface AboSpreadTotals {
  total: number;
  oPos: number;
  oNeg: number;
  aPos: number;
  aNeg: number;
  bPos: number;
  bNeg: number;
  abPos: number;
  abNeg: number;
  unknown: number;
}

export interface AboSpreadPercentages {
  total: number;
  oPos: number;
  oNeg: number;
  aPos: number;
  aNeg: number;
  bPos: number;
  bNeg: number;
  abPos: number;
  abNeg: number;
  unknown: number;
}

export interface AboSpreadResponse {
  rows: AboSpreadRow[];
  totals: AboSpreadTotals;
  percentages: AboSpreadPercentages;
  unknownAbo: number;
}

export interface DonationTypeOption {
  donationType: string;
  description: string;
}

export interface SponsorDriveOption {
  driveId: string;
  driveDate: string;
  label: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}

const API_ENDPOINTS = {
  BY_DRIVE: '/api/v1/abo-spread/by-drive',
  DRIVE_DONATION_TYPES: '/api/v1/abo-spread/by-drive/donation-types',
  BY_SPONSOR: '/api/v1/abo-spread/by-sponsor',
  SPONSOR_DRIVES: '/api/v1/abo-spread/by-sponsor/drives',
  SPONSOR_DONATION_TYPES: '/api/v1/abo-spread/by-sponsor/donation-types',
};

@Injectable({
  providedIn: 'root'
})
export class AboSpreadService {
  private readonly apiService = inject(ApiService);

  getAboSpreadByDrive(driveId: string, donationType: string = 'AL'): Observable<AboSpreadResponse> {
    const params = new HttpParams()
      .set('driveId', driveId)
      .set('donationType', donationType);

    return this.apiService.get<ApiResponse<AboSpreadResponse>>(API_ENDPOINTS.BY_DRIVE, { params }).pipe(
      map(response => response?.item ?? { rows: [], totals: this.emptyTotals(), percentages: this.emptyPercentages(), unknownAbo: 0 })
    );
  }

  getDonationTypesByDrive(driveId: string): Observable<DonationTypeOption[]> {
    const params = new HttpParams().set('driveId', driveId);

    return this.apiService.get<ApiResponse<DonationTypeOption>>(API_ENDPOINTS.DRIVE_DONATION_TYPES, { params }).pipe(
      map(response => response?.data ?? [])
    );
  }

  getAboSpreadBySponsor(sponsorId: string, donationType: string = 'AL', driveIds: string[] = []): Observable<AboSpreadResponse> {
    let params = new HttpParams()
      .set('sponsorId', sponsorId)
      .set('donationType', donationType);

    if (driveIds.length > 0) {
      params = params.set('driveIds', driveIds.join(','));
    }

    return this.apiService.get<ApiResponse<AboSpreadResponse>>(API_ENDPOINTS.BY_SPONSOR, { params }).pipe(
      map(response => response?.item ?? { rows: [], totals: this.emptyTotals(), percentages: this.emptyPercentages(), unknownAbo: 0 })
    );
  }

  getDrivesBySponsor(sponsorId: string, chapterId: string): Observable<SponsorDriveOption[]> {
    let params = new HttpParams().set('sponsorId', sponsorId);
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService.get<ApiResponse<SponsorDriveOption>>(API_ENDPOINTS.SPONSOR_DRIVES, { params }).pipe(
      map(response => response?.data ?? [])
    );
  }

  getDonationTypesBySponsor(chapterId: string): Observable<DonationTypeOption[]> {
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService.get<ApiResponse<DonationTypeOption>>(API_ENDPOINTS.SPONSOR_DONATION_TYPES, { params }).pipe(
      map(response => response?.data ?? [])
    );
  }

  private emptyTotals(): AboSpreadTotals {
    return { total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0 };
  }

  private emptyPercentages(): AboSpreadPercentages {
    return { total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0 };
  }
}
