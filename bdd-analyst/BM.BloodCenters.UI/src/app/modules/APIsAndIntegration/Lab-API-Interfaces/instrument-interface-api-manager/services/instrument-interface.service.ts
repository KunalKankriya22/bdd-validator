import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { INSTRUMENT_INTERFACE_API_ENDPOINTS } from '../constants/api-endpoints.constants';
import {
  Chapter,
  ChapterApiResponse,
  Instrument,
  InstrumentApiResponse,
  RawDataApiResponse,
  UploadStatusApiResponse,
  ErrorCode,
  ErrorCodeApiResponse,
  ErrorHandlingFilterRequest,
  MachineTestId,
  MachineTestIdApiResponse,
  LogFile,
  UserDetailsApiResponse,
} from '../models/instrument-interface.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentInterfaceService {
  private readonly apiService = inject(ApiService);

  getChapters(): Observable<Chapter[]> {
    return this.apiService.get<ChapterApiResponse>(INSTRUMENT_INTERFACE_API_ENDPOINTS.CHAPTERS).pipe(
      map(response =>
        response.data.map((chapter: { chapterId: string; chapterName: string }) => ({
          id: chapter.chapterId,
          name: chapter.chapterName
        }))
      )
    );
  }

  getInstruments(): Observable<Instrument[]> {
    return this.apiService.get<InstrumentApiResponse>(INSTRUMENT_INTERFACE_API_ENDPOINTS.INSTRUMENTS).pipe(
      map(response => {
        return response.data.map((instrument: { code: string; codeDesc: string }) => ({
          id: instrument.code,
          name: `${instrument.code} - ${instrument.codeDesc}`,
          chapterId: ''
        }));
      })
    );
  }

  getRawData(
    chapterId: string,
    instrumentId: string,
    take: number = 10,
    skip: number = 0,
    searchItem: string = '',
    fileId: string = '',
    sortDirection: string = 'ASC'
  ): Observable<RawDataApiResponse> {
    const body = {
      chapterId: chapterId,
      machineId: instrumentId,
      searchItem: searchItem,
      fileId: fileId,
      sortDirection: sortDirection
    };
    return this.apiService.post<RawDataApiResponse>(INSTRUMENT_INTERFACE_API_ENDPOINTS.RAW_DATA(take, skip), body);
  }

  getPendingFileIds(chapterId: string, instrumentId: string): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.PENDING_FILE_IDS(chapterId, instrumentId));
  }

  getUploadStatus(
    chapterId: string,
    instrumentId: string,
    take: number = 10,
    skip: number = 0,
    searchItem: string = '',
    filters?: {
      fileId?: string;
      testBatchId?: string;
      uploadStatus?: string;
      processDateFrom?: string;
      processDateTo?: string;
    },
    sortDirection: string = 'DESC'
  ): Observable<UploadStatusApiResponse> {
    const payload: any = {
      machineId: instrumentId,
      chapterId: chapterId,
      searchItem: filters?.testBatchId || searchItem || '',
      fileId: filters?.fileId || '',
      uploadStatus: filters?.uploadStatus || '',
      processDateFrom: filters?.processDateFrom || '',
      processDateTo: filters?.processDateTo || '',
      sortDirection: sortDirection
    };

    return this.apiService.post<UploadStatusApiResponse>(INSTRUMENT_INTERFACE_API_ENDPOINTS.UPLOAD_STATUS(take, skip), payload);
  }

  getFileIds(chapterId: string, instrumentId: string, source: string = 'both'): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.FILE_IDS(chapterId, instrumentId, source));
  }

  getTestBatchIds(chapterId: string, instrumentId: string): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.TEST_BATCH_IDS(chapterId, instrumentId));
  }

  getUploadStatuses(chapterId: string, instrumentId: string): Observable<{ value: string; label: string }[]> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.UPLOAD_STATUSES(chapterId, instrumentId)).pipe(
      map(response => {
        if (response && Array.isArray(response.data)) {
          return response.data.map((item: { statusCode: string; statusDescription: string }) => ({
            value: item.statusCode,
            label: `${item.statusCode} - ${item.statusDescription}`
          }));
        }
        return [];
      })
    );
  }

  getUnitDetails(
    chapterId: string,
    machineId: string,
    fileId?: string,
    sort?: string
  ): Observable<any> {
    const payload = {
      chapterId: chapterId,
      machineId: machineId,
      fileId: fileId || null,
      sort: sort || null
    };
    return this.apiService.post<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.UNIT_DETAILS, payload);
  }

  getErrorCodes(
    chapterId: string,
    instrumentId: string,
    take: number = 1000,
    skip: number = 0
  ): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.ERROR_HANDLING.LIST(take, skip), {
      params: {
        chapterId: chapterId,
        machineId: instrumentId
      } as any
    });
  }

  filterErrorCodes(
    take: number,
    skip: number,
    payload: ErrorHandlingFilterRequest
  ): Observable<ErrorCodeApiResponse> {
    return this.apiService.post<ErrorCodeApiResponse>(
      INSTRUMENT_INTERFACE_API_ENDPOINTS.ERROR_HANDLING.FILTER(take, skip),
      payload
    );
  }

  getMachineTestIds(chapterId: string, instrumentId: string): Observable<MachineTestId[]> {
    return this.apiService.get<MachineTestIdApiResponse>(
      INSTRUMENT_INTERFACE_API_ENDPOINTS.MACHINE_TEST_IDS(chapterId, instrumentId)
    ).pipe(
      map(response => Array.isArray(response.data) ? response.data : [])
    );
  }

  getErrorCodeDetails(
    chapterId: string,
    machineId: string,
    machineTestId: string,
    errorCode: string
  ): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.ERROR_HANDLING.DETAILS(chapterId, machineId, machineTestId, errorCode));
  }

  addErrorCode(errorCode: ErrorCode, chapterId: string, machineId: string): Observable<any> {
    const payload: any = {
      chapterId: errorCode.chapterId || chapterId,
      machineId: errorCode.machineId || machineId,
      machineTestId: errorCode.machineTestId,
      errorCode: errorCode.errorCode,
      errorDesc: errorCode.errorDesc,
      skipLevel: errorCode.skipLevel,
      programId: errorCode.programId || 'IIAPIMGR',
      effDate: errorCode.effDate
    };

    if (errorCode.termDate && errorCode.termDate.trim() !== '') {
      payload.termDate = errorCode.termDate;
    }

    return this.apiService.post<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.ERROR_HANDLING.CREATE, payload);
  }

  updateErrorCode(errorCode: ErrorCode, chapterId: string, machineId: string): Observable<any> {
    const payload: any = {
      auditKey: errorCode.auditKey,
      chapterId: errorCode.chapterId || chapterId,
      machineId: errorCode.machineId || machineId,
      machineTestId: errorCode.machineTestId,
      errorCode: errorCode.errorCode,
      errorDesc: errorCode.errorDesc,
      skipLevel: errorCode.skipLevel,
      programId: errorCode.programId || 'IIAPIMGR',
      effDate: errorCode.effDate
    };

    if (errorCode.termDate && errorCode.termDate.trim() !== '') {
      payload.termDate = errorCode.termDate;
    }

    return this.apiService.put<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.ERROR_HANDLING.UPDATE, payload);
  }

  getLogFiles(instrumentId: string): Observable<LogFile[]> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.LOG_FILES(instrumentId)).pipe(
      map(response => {
        if (response && Array.isArray(response.data)) {
          return response.data.map((file: any) => ({
            fileName: file.outputFile || '',
            fileId: file.fileId || '',
            parmId: file.parmId || '',
            reportStatus: file.reportStatus || '',
            submitDate: file.submitDate || '',
            applId: file.applId || '',
            reportName: file.reportName || '',
            userName: file.userName || '',
            repServer: file.repServer || file.RepServer || '',
          }));
        }
        return [];
      })
    );
  }

  uploadFile(fileId: string, file: File): Observable<{ success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    return this.apiService.post<{ success: boolean }>(INSTRUMENT_INTERFACE_API_ENDPOINTS.UPLOAD, formData);
  }

  manualUpload(chapterId: string, instrumentId: string, fileId: string): Observable<any> {
    const body = {
      machineId: instrumentId,
      fileId: fileId,
      chapterId: chapterId
    };
    return this.apiService.post<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.MANUAL_UPLOAD, body);
  }

  getReportUrl(parmId: string, applId: string, reportName: string, userName: string): Observable<any> {
    return this.apiService.post<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.REPORT_ACTION_URL, {
      parmId, applId, reportName, userName
    });
  }

  getLogFileContent(parmId: string): Observable<any> {
    return this.apiService.get<any>(INSTRUMENT_INTERFACE_API_ENDPOINTS.LOG_FILE_CONTENT(parmId));
  }

  downloadLogFile(parmId: string): Observable<Blob> {
    return this.apiService.get<Blob>(INSTRUMENT_INTERFACE_API_ENDPOINTS.LOG_FILE_DOWNLOAD(parmId), {
      responseType: 'blob' as any
    });
  }

  getUserDetails(userId: string): Observable<UserDetailsApiResponse> {
    return this.apiService.get<UserDetailsApiResponse>(INSTRUMENT_INTERFACE_API_ENDPOINTS.USER_DETAILS(userId));
  }
}
