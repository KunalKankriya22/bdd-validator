import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ViewDonorsInListResponse, DonorListInfo, DonorInList } from './view-donors-in-list.model';

interface DonorListLookupDto {
  listId: string;
  listName: string;
}

interface DonorListMetadataDto {
  listId: string;
  listName: string;
  listType: string;
  priority: string;
  eligibilityCheck: string;
  donorOverride: string;
  maxSize: number;
  actualSize: number;
}

interface DonorListMemberDto {
  donorId: string;
  lastName: string;
  firstName: string;
  gender: string;
  homePhone: string | null;
  businessPhone: string | null;
  lockedBy: string | null;
  status: string | null;
}

interface ReturnResult<T> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ViewDonorsInListService {
  private readonly apiService = inject(ApiService);

  getDonorsByListId(listId: string): Observable<ViewDonorsInListResponse> {
    const metadataEndpoint = API.DONOR_LIST_VIEWER.METADATA(listId);
    const donorsEndpoint = API.DONOR_LIST_VIEWER.DONORS(listId, 1000, 0); // Get all donors (max 1000)

    return forkJoin({
      metadata: this.apiService.get<ReturnResult<DonorListMetadataDto>>(metadataEndpoint),
      donors: this.apiService.post<ReturnResult<DonorListMemberDto>>(donorsEndpoint, {
        sortColumn: 'LAST_NAME',
        sortDirection: 'ASC'
      })
    }).pipe(
      map(({ metadata, donors }) => {
        const metadataItem = metadata.item;
        const donorsList = donors.data ?? [];

        const listInfo: DonorListInfo = {
          listId: metadataItem?.listId ?? listId,
          name: metadataItem?.listName ?? '',
          type: metadataItem?.listType ?? '',
          size: metadataItem?.actualSize?.toString() ?? '0',
          priority: metadataItem?.priority ?? '',
          fullEligibility: metadataItem?.eligibilityCheck === 'Y',
          donorOverride: metadataItem?.donorOverride === 'Y'
        };

        const donorsData: DonorInList[] = donorsList.map(donor => ({
          donorId: donor.donorId,
          lastName: donor.lastName,
          firstName: donor.firstName,
          sex: donor.gender === 'M' ? 'Male' : donor.gender === 'F' ? 'Female' : donor.gender,
          homePhoneInternational: donor.homePhone ?? '–',
          businessPhoneInternational: donor.businessPhone ?? '–',
          lockBy: donor.lockedBy ?? '–',
          donorStatus: donor.status ?? '–'
        }));

        return {
          success: metadata.success ?? true,
          message: metadata.message ?? '',
          statusCode: metadata.statusCode ?? 200,
          data: {
            listInfo,
            donors: donorsData
          },
          total: donors.total ?? donorsList.length,
          errorResponse: metadata.errorResponse
        };
      })
    );
  }

  getAvailableListIds(): Observable<string[]> {
    const endpoint = API.DONOR_LIST_VIEWER.LOOKUP(10000);
    return this.apiService
      .get<ReturnResult<DonorListLookupDto>>(endpoint)
      .pipe(
        map(response => (response.data ?? []).map(item => item.listId))
      );
  }
}
