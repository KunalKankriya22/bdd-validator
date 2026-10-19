import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';

import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonorDetail,
  DonorDetailResponse,
  DonorEligibility,
  DonorAttribute,
  CentralNote,
  CellLoss,
  InterdictionHold,
  MergedDonor,
  MergedDonorInterdiction,
  MergeHoldUnit,
  PotentialDuplicate,
  DonorLetter,
} from '../models/donor-detail-query.model';

@Injectable({
  providedIn: 'root',
})
export class DonorDetailQueryService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private chapterTimezoneService = inject(ChapterTimezoneService);

  getDonorDetail(donorId: string): Observable<DonorDetailResponse> {
    return forkJoin({
      donorDetail: this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_BY_ID(donorId)),
      procedureCodes: this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_PROCEDURE_CODES(donorId)),
      attributes: this.getDonorAttributes(donorId)
    }).pipe(
      map((responses) => {
        const raw = responses.donorDetail.item;
        if (!raw) {
          throw new Error(`Donor not found: ${donorId}`);
        }

        const donor = this.mapApiResponseToDonorDetail(raw, donorId);
        const eligibility = this.mapProcedureCodesToEligibility(responses.procedureCodes.data || []);
        const attributes = responses.attributes;

        return { donor, eligibility, attributes } as DonorDetailResponse;
      }),
      catchError((error) => {
        this.loggingService.warn('Error fetching donor details:', error);
        return throwError(() => new Error(`Donor not found: ${donorId}`));
      })
    );
  }

  private mapApiResponseToDonorDetail(raw: any, donorId: string): DonorDetail {
    let addressLine1 = '';
    let addressLine2 = '';
    let city = '';
    let state = '';
    let zipCode = '';

    if (typeof raw.address === 'string' && raw.address) {
      const addressParts = raw.address.trim().split(/\s+/);

      if (addressParts.length > 0) {
        const lastPart = addressParts[addressParts.length - 1];
        if (/^\d{5}$/.test(lastPart)) {
          zipCode = lastPart;
          addressParts.pop();
        }
      }

      if (addressParts.length > 0) {
        const secondLast = addressParts[addressParts.length - 1];
        if (/^[A-Z]{2}$/.test(secondLast)) {
          state = secondLast;
          addressParts.pop();
        }
      }

      if (addressParts.length > 0) {
        let cityStart = addressParts.length - 1;
        while (cityStart > 0 && /^[A-Z]+$/.test(addressParts[cityStart])) {
          cityStart--;
        }
        cityStart = Math.max(0, cityStart + 1);

        if (cityStart < addressParts.length) {
          city = addressParts.slice(cityStart).join(' ');
          addressLine1 = addressParts.slice(0, cityStart).join(' ');
        } else {
          addressLine1 = addressParts.join(' ');
        }
      } else {
        addressLine1 = raw.address;
      }
    }

    return {
      donorId: donorId,
      lastName: raw.lastName || '',
      firstName: raw.firstName || '',
      middleName: raw.middleName || '',
      dateOfBirth: raw.dateOfBirth || '',
      sex: raw.gender || '',
      aboRh: raw.bloodTypeDescription || raw.bloodType || raw.aboRh || '',
      alternateType: raw.alternateIdType || raw.alternateType,
      alternateId: raw.alternateId,
      phoneHome: raw.homePhone && raw.homePhone !== '--' ? raw.homePhone : undefined,
      phoneMobile: raw.mobilePhone && raw.mobilePhone !== '--' ? raw.mobilePhone : undefined,
      phoneWork: raw.businessPhone && raw.businessPhone !== '--' ? raw.businessPhone : undefined,
      extension: raw.extension || undefined,
      preferredContactFlag: raw.preferredContactFlag,
      address: {
        line1: addressLine1,
        line2: addressLine2,
        city: city,
        state: state,
        zipCode: zipCode,
      },
      alternateAddress: raw.alternateAddress || (raw.altStreetName || raw.altIntlAddress1)
        ? {
            streetName: raw.altStreetName,
            suiteApt: raw.altSuiteApt,
            city: raw.altCity,
            state: raw.altState,
            zip: raw.altZip,
            intlAddress1: raw.altIntlAddress1,
            intlAddress2: raw.altIntlAddress2,
            intlAddress3: raw.altIntlAddress3,
            intlAddress4: raw.altIntlAddress4,
            countryName: raw.altCountryName,
            intlPostalCode: raw.altIntlPostalCode,
            isInternational: raw.altIntlAddrFlag === 'Y',
            preferredContactAddrFlag: raw.preferredContactAddrFlag,
          }
        : undefined,
      statistics: {
        lifeDonations: raw.lifetimeDonations || 0,
        lifeLtr: raw.lifetimeCredit || 0,
        ytdDonations: raw.yearToDateDonations || 0,
        ytdLtr: raw.yearToDateCredit || 0,
        lifetimeGallon: raw.lifetimeGallons || 0,
        unitsRequiredNext: raw.nextGallonCredit || 1,
        donorSince: raw.donorSince || '',
        yearsAsDonor: parseInt(raw.donorYear || '0', 10),
      },
      lastDonation: (raw.lastDonationUnitId || raw.lastDonationStatus || raw.lastDonation)
        ? {
            unitId: raw.lastDonationUnitId || raw.lastDonation?.unitId || '',
            status: raw.lastDonationStatus || raw.lastDonation?.status,
            date: raw.lastDonationDate || raw.lastDonation?.date || '',
            donation: raw.lastDonationType || raw.lastDonation?.donation || '',
            procedure: raw.lastProcedureCode || raw.lastDonation?.procedure || '',
          }
        : undefined,
      hasDocuments: raw.hasDocuments || (raw.documentCount || 0) > 0,
      documentCount: raw.documentCount || 0,
    };
  }

  private mapProcedureCodesToEligibility(procedureCodes: any[]): DonorEligibility[] {
    return procedureCodes.map(proc => ({
      proc: proc.procedureCode || proc.proc,
      status: proc.eligibilityStatus || 'NO',
      eligibilityDate: proc.deferralDate || this.chapterTimezoneService.getChapterLocalDate().format('DD-MMM-YYYY').toUpperCase(),
      reason: proc.deferralReason || (proc.eligibilityStatus === 'Yes' ? 'Eligible for donation' : 'Not eligible'),
    }));
  }

  private mapInterdictionsToAttributes(interdictions: any[]): DonorAttribute[] {
    return interdictions.map(inter => ({
      code: inter.interCode || inter.code || '',
      type: inter.interType || inter.type || '',
      description: inter.interDesc || inter.description || '',
    }));
  }

  getDonorEligibility(donorId: string): Observable<DonorEligibility[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_PROCEDURE_CODES(donorId)).pipe(
      map((response) => this.mapProcedureCodesToEligibility(response.data || [])),
      catchError((error) => {
        this.loggingService.warn('Error fetching donor eligibility:', error);
        return of([]);
      })
    );
  }

  getDonorAttributes(donorId: string): Observable<DonorAttribute[]> {
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(donorId)).pipe(
      map((response) => {
        const attributes = response.data && Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : [];
        return this.mapInterdictionsToAttributes(attributes || []);
      }),
      catchError((error) => {
        this.loggingService.warn('Error fetching donor attributes:', error);
        return of([]);
      })
    );
  }

  formatDate(date: string): string {
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  getCentralNotes(donorId: string): Observable<CentralNote[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_NOTES(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getCellLoss(donorId: string): Observable<CellLoss[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_CELL_LOSS(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getYtdLoss(donorId: string): Observable<{ rbcLoss: number; plasmaLoss: number }> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_YTD_LOSS(donorId)).pipe(
      map((response) => {
        const item = response.item || response.data || {};
        return {
          rbcLoss: item.rbcLoss ?? 0,
          plasmaLoss: item.plasmaLoss ?? 0,
        };
      }),
      catchError(() => of({ rbcLoss: 0, plasmaLoss: 0 }))
    );
  }

  getInterdictionHolds(donorId: string, filter: 'active' | 'all' = 'active'): Observable<InterdictionHold[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_INTERDICTION_HOLDS(donorId, filter)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getMergedDonors(donorId: string): Observable<MergedDonor[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_MERGED_DONORS(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getMergedInterdictions(donorId: string): Observable<MergedDonorInterdiction[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_MERGED_INTERDICTIONS(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getMergeHoldUnits(donorId: string): Observable<MergeHoldUnit[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_MERGE_HOLD_UNITS(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getPotentialDuplicates(donorId: string): Observable<PotentialDuplicate[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_POTENTIAL_DUPLICATES(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }

  getDonorLetters(donorId: string): Observable<DonorLetter[]> {
    return this.apiService.get<any>(API.DONOR_DETAIL_QUERY.GET_LETTERS(donorId)).pipe(
      map((response) => response.data || []),
      catchError(() => of([]))
    );
  }
}
