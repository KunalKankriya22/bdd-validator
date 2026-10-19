import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  PlasmaFileTypeDto,
  XmlErrorLogEntryDto,
  SearchXmlErrorLogRequest,
} from '../models/xml-error-log.model';

@Injectable({ providedIn: 'root' })
export class XmlErrorLogApiService {
  private readonly http = inject(HttpClient);

  getPlasmaFileTypes(): Observable<ReturnResult<PlasmaFileTypeDto>> {
    return this.http.get<ReturnResult<PlasmaFileTypeDto>>(
      API.XML_ERROR_LOG.PLASMA_FILE_TYPES,
    );
  }

  searchLogEntries(request: SearchXmlErrorLogRequest): Observable<ReturnResult<XmlErrorLogEntryDto>> {
    return this.http.post<ReturnResult<XmlErrorLogEntryDto>>(
      API.XML_ERROR_LOG.SEARCH,
      request,
    );
  }
}
