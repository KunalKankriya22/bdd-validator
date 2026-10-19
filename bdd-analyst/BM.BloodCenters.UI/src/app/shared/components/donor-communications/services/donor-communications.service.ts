import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import { LoggingService } from '../../../services/logging.service';
import {
  DonorCommunication,
  CreateDonorCommunicationDto,
  UpdateDonorCommunicationDto,
  CommunicationType,
  CommunicationCode,
  ActionCode,
  CommunicationLetter,
  LetterCode,
  PaginatedResponse,
  ApiResponse,
  DonorHeader
} from '../models/donor-communications.model';

@Injectable({
  providedIn: 'root'
})
export class DonorCommunicationsService {
  private readonly http = inject(HttpClient);
  private readonly loggingService = inject(LoggingService);
  private readonly baseUrl = `${environment.apiUrl}${API.DONOR_COMMUNICATIONS.BASE}`;
  private readonly queryUrl = `${environment.apiUrl}${API.DONOR_COMMUNICATIONS.QUERY}`;
  private readonly demographicsBaseUrl = `${environment.apiUrl}/api/v1/donor-demographics`;

  /**
   * Get all communications for a donor (paginated, sortable)
   */
  getCommunications(
    donorId: string,
    pageNumber = 1,
    pageSize = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<PaginatedResponse<DonorCommunication>> {
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // Request body matching DonorCommunicationQueryParamsDto
    // Use a wide date range to get all communications for the donor
    const fromDate = new Date('1900-01-01').toISOString();
    const toDate = new Date('2099-12-31').toISOString();

    const body = {
      donorId: donorId,
      fromDate: fromDate,
      toDate: toDate,
      commType: null,
      commCode: null,
      userId: null,
      sortColumn: sortBy || null,
      sortOrder: sortOrder || null,
      pendingActionsOnly: null,
      searchKeyword: null
    };

    return this.http.post<any>(
      `${this.queryUrl}/${take}/${skip}`,
      body
    ).pipe(
      map((response: any) => {
        const rawData = response.Data || response.data || [];
        const mappedData = rawData.map((item: any) => ({
          donorId: item.DonorId || item.donorId,
          comType: item.ComType || item.comType,
          comCode: item.ComCode || item.comCode,
          comTypeDesc: item.ComTypeDesc || item.comTypeDesc || '',
          comCodeDesc: item.ComCodeDesc || item.comCodeDesc || '',
          actionCodeDesc: item.ActionCodeDesc || item.actionCodeDesc || '',
          insertUser: item.InsertUser || item.insertUser,
          insertDate: item.InsertDate || item.insertDate,
          comDate: item.ComDate || item.comDate || item.InsertDate || item.insertDate,
          actionCode: item.ActionCode !== undefined ? item.ActionCode : (item.actionCode !== undefined ? item.actionCode : undefined),
          targetDate: item.TargetDate !== undefined ? item.TargetDate : (item.targetDate !== undefined ? item.targetDate : undefined),
          actionDate: item.ActionDate !== undefined ? item.ActionDate : (item.actionDate !== undefined ? item.actionDate : undefined),
          comDesc: item.ComDesc !== undefined ? item.ComDesc : (item.comDesc !== undefined ? item.comDesc : undefined),
          userName: item.UserName || item.userName || item.InsertUser || item.insertUser,
          sequenceNumber: item.SequenceNumber || item.sequenceNumber || 0,
          chapterId: item.ChapterId || item.chapterId,
          name: item.Name || item.name,
          dob: item.Dob || item.dob,
          sex: item.Sex || item.sex,
          abo: item.Abo || item.abo
        }));

        const paginatedResponse: PaginatedResponse<DonorCommunication> = {
          data: mappedData,
          totalCount: response.Total || response.total || 0,
          pageNumber: pageNumber,
          pageSize: pageSize
        };

        return paginatedResponse;
      })
    );
  }

  /**
   * Get single communication
   */
  getCommunication(donorId: string, sequenceNumber: number): Observable<DonorCommunication> {
    return this.http.get<ApiResponse<DonorCommunication>>(
      `${this.baseUrl}/${donorId}/${sequenceNumber}`
    ).pipe(map(response => response.data));
  }

  /**
   * Create new communication
   * ChapterId is automatically set by the backend from user context
   */
  createCommunication(dto: CreateDonorCommunicationDto): Observable<DonorCommunication> {
    // Backend expects PascalCase property names
    const payload = {
      DonorId: dto.donorId,
      ComDate: dto.comDate,
      CommType: dto.comType,
      CommCode: dto.comCode,
      ComDesc: dto.comDesc,
      ActionCode: dto.actionCode,
      TargetDate: dto.targetDate,
      ActionDate: dto.actionDate
    };

    return this.http.post<ApiResponse<DonorCommunication>>(
      this.baseUrl,
      payload
    ).pipe(map(response => response.data));
  }

  /**
   * Update communication (comDesc and actionDate only)
   */
  updateCommunication(
    donorId: string,
    sequenceNumber: number,
    dto: UpdateDonorCommunicationDto
  ): Observable<DonorCommunication> {
    return this.http.put<ApiResponse<DonorCommunication>>(
      `${this.baseUrl}/${donorId}/${sequenceNumber}`,
      dto
    ).pipe(map(response => response.data));
  }

  /**
   * Delete communication
   */
  deleteCommunication(donorId: string, sequenceNumber: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${donorId}/${sequenceNumber}`);
  }

  /**
   * Get communication types lookup
   */
  getCommunicationTypes(donorId?: string): Observable<CommunicationType[]> {
    interface TypesApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: Array<{
        commType: string;
        commTypeDesc: string;
      }>;
      total: number;
    }

    const options = donorId ? { params: { donorId } } : {};
    return this.http.get<TypesApiResponse>(
      `${this.baseUrl}/types`,
      options
    ).pipe(
      map(response => {
        // Map API response fields to our model
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map(item => ({
            code: item.commType,
            description: item.commTypeDesc
          }));
        }
        return [];
      }),
      catchError((error) => {
        this.loggingService.warn('getCommunicationTypes API error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Get codes for a communication type (cascading)
   */
  getCommunicationCodes(commType: string): Observable<CommunicationCode[]> {
    interface CodesApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: Array<{
        commCode?: string;
        commCodeDesc?: string;
        code?: string;
        description?: string;
      }>;
      total: number;
    }

    return this.http.get<CodesApiResponse>(
      `${this.baseUrl}/codes/${commType}`
    ).pipe(
      map(response => {
        // Map API response fields to our model
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map(item => ({
            code: item.commCode || item.code || '',
            description: item.commCodeDesc || item.description || ''
          }));
        }
        return [];
      }),
      catchError((error) => {
        this.loggingService.warn('getCommunicationCodes API error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Get action codes lookup
   */
  getActionCodes(commType: string): Observable<ActionCode[]> {
    interface ActionCodesApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: Array<{
        actionCode?: string;
        actionCodeDesc?: string;
        code?: string;
        description?: string;
        targetDays?: number;
        TargetDays?: number;
      }>;
      total: number;
    }

    return this.http.get<ActionCodesApiResponse>(
      `${this.baseUrl}/action-codes/${commType}`
    ).pipe(
      map(response => {
        // Map API response fields to our model
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map(item => ({
            code: item.actionCode || item.code || '',
            description: item.actionCodeDesc || item.description || '',
            targetDays: item.targetDays ?? item.TargetDays ?? undefined
          }));
        }
        return [];
      }),
      catchError((error) => {
        this.loggingService.warn('getActionCodes API error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Get letter history for a donor
   */
  getLetters(donorId: string): Observable<CommunicationLetter[]> {
    interface DonorLetterHistoryResponse {
      LetterSeqNo: string;
      letterSeqNo?: string;
      LetterCode: string;
      LetterTitle: string;
      GenerateDate: string;
      generateDate?: string;
      AuthorizedBy: string;
      Comments?: string;
      comments?: string;
      letterText?: string;
    }

    interface LettersApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: DonorLetterHistoryResponse[];
      total: number;
    }

    return this.http.get<LettersApiResponse | DonorLetterHistoryResponse[]>(
      `${this.baseUrl}/letters/${donorId}`
    ).pipe(
      map(response => {
        // Handle both wrapped and unwrapped responses
        const rawData = Array.isArray(response)
          ? response as DonorLetterHistoryResponse[]
          : (response as LettersApiResponse)?.data || [];

        // Map backend LetterSeqNo to frontend letterId
        return rawData.map((item: DonorLetterHistoryResponse) => ({
          letterId: item.letterSeqNo || item.LetterSeqNo,
          letterCode: item.LetterCode,
          letterTitle: item.LetterTitle,
          letterDate: item.generateDate || item.GenerateDate,
          authorizedBy: item.AuthorizedBy,
          comments: item.comments || item.Comments,
          letterText: item.letterText
        }));
      }),
      catchError((error) => {
        this.loggingService.warn('getLetters API error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Get letter text
   */
  getLetterText(donorId: string, letterId: string): Observable<string> {
    return this.http.get(
      `${this.baseUrl}/letter-text/${donorId}/${letterId}`,
      { responseType: 'text' }
    );
  }

  /**
   * Get letter codes lookup (for send letter)
   */
  getLetterCodes(): Observable<LetterCode[]> {
    interface LetterListResponse {
      letterCode: string;
      letterTitle: string;
      versionNo: number;
      versionDate?: string;
    }

    interface LetterCodesApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: LetterListResponse[];
      total: number;
    }

    return this.http.get<LetterCodesApiResponse>(
      `${this.baseUrl}/letter-codes`
    ).pipe(
      map(response => {
        const data = response?.data || [];
        // Map API response fields to frontend model
        return data.map((item: LetterListResponse) => ({
          code: item.letterCode,
          description: item.letterTitle,
          versionNumber: item.versionNo?.toString(),
          versionDate: item.versionDate
        } as LetterCode));
      }),
      catchError((error) => {
        this.loggingService.warn('getLetterCodes API error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Retrieve letter template by code
   */
  retrieveLetterTemplate(letterCode: string): Observable<LetterCode> {
    interface LetterDetailResponse {
      letterCode: string;
      letterTitle: string;
      versionNo: number;
      versionDate: string;
      letterContent: string;
    }

    return this.http.get<LetterDetailResponse>(
      `${this.baseUrl}/letter-template/${letterCode}`
    ).pipe(
      map(data => ({
        code: data.letterCode,
        description: data.letterTitle,
        versionNumber: data.versionNo?.toString(),
        versionDate: data.versionDate,
        letterText: data.letterContent  // Map letterContent to letterText
      }))
    );
  }

  /**
   * Generate letter (merge communication with template)
   */
  generateLetter(
    donorId: string,
    letterCode: string,
    commType: string,
    commCode: string,
    templateText: string
  ): Observable<string> {
    // Backend expects GenerateLetterRequestDto with PascalCase properties
    const payload = {
      DonorIds: [donorId],  // Backend expects array of donor IDs
      LetterCode: letterCode,
      ChapterId: '',  // Backend will set from user context
      TemplateText: templateText  // Template text from retrieveLetterTemplate
    };

    // Backend returns camelCase JSON (ASP.NET Core default)
    interface GenerateLetterResponse {
      mergedText: string;
      donorId: string;
    }

    return this.http.post<GenerateLetterResponse>(
      `${this.baseUrl}/generate-letter`,
      payload
    ).pipe(
      map(response => response.mergedText || '')
    );
  }

  /**
   * Save and print letter
   */
  saveAndPrintLetter(
    donorId: string,
    letterCode: string,
    commType: string,
    commCode: string,
    mergedText: string,
    comments?: string
  ): Observable<void> {
    const payload = {
      DonorId: donorId,
      LetterCode: letterCode,
      CommType: commType,
      CommCode: commCode,
      MergedText: mergedText,
      ChapterId: '',
      Comments: comments || ''
    };

    return this.http.post<void>(
      `${this.baseUrl}/save-print-letter`,
      payload
    );
  }

  /**
   * Get donor header information (name, DOB, sex, ABO)
   */
  getDonorHeader(donorId: string): Observable<DonorHeader> {
    interface HeaderApiResponse {
      success: boolean;
      message?: string;
      statusCode: number;
      data: DonorHeader[];
      total: number;
      errorResponse?: {
        errorCode: string;
        error: string;
      };
    }

    return this.http.get<HeaderApiResponse>(
      `${this.demographicsBaseUrl}/${donorId}/header`
    ).pipe(
      map(response => {
        const dataArray = response?.data;
        if (dataArray && Array.isArray(dataArray) && dataArray.length > 0) {
          const item: any = dataArray[0];
          return {
            name: item.name || item.Name || '',
            dateOfBirth: item.dateOfBirth || item.DateOfBirth || item.Dob || item.dob,
            sex: item.sex || item.Sex,
            abo: item.abo || item.Abo
          } as DonorHeader;
        }
        return {
          name: '',
          dateOfBirth: undefined,
          sex: undefined,
          abo: undefined
        } as DonorHeader;
      }),
      catchError((error) => {
        this.loggingService.warn('getDonorHeader API error:', error);
        return of({
          name: '',
          dateOfBirth: undefined,
          sex: undefined,
          abo: undefined
        } as DonorHeader);
      })
    );
  }

  checkDlcomAccess(): Observable<boolean> {
    return this.http.get<{ hasAccess: boolean }>(`${this.baseUrl}/check-dlcom-access`).pipe(
      map(response => response?.hasAccess === true),
      catchError(() => of(false))
    );
  }

  getUserFullName(userId: string): Observable<string> {
    return this.http.get<any>(
      `${environment.apiUrl}/api/v1/donor-communication-query/users`
    ).pipe(
      map(response => {
        const users = Array.isArray(response)
          ? response
          : (response.Data || response.data || []);
        const user = users.find((u: any) =>
          (u.UserId || u.userId || '').toUpperCase() === userId.toUpperCase()
        );
        return user ? (user.UserName || user.userName || userId) : userId;
      }),
      catchError(() => of(userId))
    );
  }
}
