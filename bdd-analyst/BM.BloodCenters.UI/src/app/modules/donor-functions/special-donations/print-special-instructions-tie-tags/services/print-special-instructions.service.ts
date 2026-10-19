import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import type {
  ApiResponse,
  DonorLookupDto,
  TieTagDto,
  PrintInstructionDto,
  PrinterDto,
  PrintTieTagsRequestDto,
} from '../models/print-special-instructions.models';

@Injectable({
  providedIn: 'root',
})
export class PrintSpecialInstructionsService {
  private readonly http = inject(HttpClient);

  getDonors(): Observable<DonorLookupDto[]> {
    return this.http
      .get<ApiResponse<DonorLookupDto[]>>(API.PRINT_SPECIAL_INSTRUCTIONS.DONORS)
      .pipe(
        map((res) =>
          (res.data || []).map((d) => ({
            ...d,
            displayValue: `${d.donorId} - ${this.formatDonorName(d.donorName)}`
          })),
        ),
      );
  }

  formatDonorName(name: string): string {
    if (!name) return '';

    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTieTags(donorId: string, interdictionCode?: string): Observable<TieTagDto[]> {
    let params = new HttpParams();

    if (interdictionCode && interdictionCode.trim()) {
      params = params.set('interdictionCode', interdictionCode.trim());
    }

    return this.http
      .get<ApiResponse<TieTagDto[]>>(API.PRINT_SPECIAL_INSTRUCTIONS.TIE_TAGS(donorId), { params })
      .pipe(map((res) => res.data || []));
  }

  getPrintInstructions(labelCode: string): Observable<PrintInstructionDto[]> {
    const params = new HttpParams().set('labelCode', labelCode);
    return this.http
      .get<ApiResponse<PrintInstructionDto[]>>(
        API.PRINT_SPECIAL_INSTRUCTIONS.PRINT_INSTRUCTIONS,
        { params },
      )
      .pipe(map((res) => res.data || []));
  }

  getPrinters(): Observable<PrinterDto[]> {
    return this.http
      .get<ApiResponse<PrinterDto[]>>(API.PRINT_SPECIAL_INSTRUCTIONS.PRINTERS)
      .pipe(map((res) => res.data || []));
  }

  printTieTags(request: PrintTieTagsRequestDto): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(API.PRINT_SPECIAL_INSTRUCTIONS.PRINT, request)
      .pipe(map(() => undefined));
  }
}
