import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateLabMasterCodeDto, UpdateLabMasterCodeDto, LabMasterCodeEditResponseDto } from '../models/lab-master-within-code.models';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class LabMasterWithinCodeApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Create a new Lab Master Code
   * POST /lab-master-codes
   */
  createCode(dto: CreateLabMasterCodeDto): Observable<void> {
    const endpoint = API.LAB_MASTER_CODES.CREATE;
    return this.apiService.post<void>(endpoint, this.formatForBackend(dto));
  }

  /**
   * Update an existing Lab Master Code
   * PUT /lab-master-codes/{codeType}/{code}
   */
  updateCode(
    codeType: string,
    code: string,
    dto: UpdateLabMasterCodeDto
  ): Observable<void> {
    const endpoint = API.LAB_MASTER_CODES.UPDATE(codeType, code);
    return this.apiService.put<void>(endpoint, this.formatForBackend(dto));
  }

  /**
   * Get Lab Master Code for editing
   * GET /lab-master-codes/{codeType}/{code}
   */
  getCodeForEdit(
    codeType: string,
    code: string
  ): Observable<LabMasterCodeEditResponseDto> {
    const endpoint = API.LAB_MASTER_CODES.UPDATE(codeType, code);
    return this.apiService.get<LabMasterCodeEditResponseDto>(endpoint)
      .pipe(
        map(response => this.formatFromBackend(response))
      );
  }

  /**
   * Converts camelCase to PascalCase for .NET compatibility
   */
  private formatForBackend(dto: any): any {
    const formatted: any = {};

    Object.keys(dto).forEach(key => {
      const value = dto[key];

      if (value instanceof Date) {
        formatted[this.toPascalCase(key)] = value.toISOString();
      }
      else if (value === null || value === undefined) {
        formatted[this.toPascalCase(key)] = null;
      }
      else {
        formatted[this.toPascalCase(key)] = value;
      }
    });

    return formatted;
  }

  /**
   * Converts PascalCase to camelCase
   */
  private formatFromBackend(response: any): any {
    const formatted: any = {};

    Object.keys(response).forEach(key => {
      const value = response[key];
      const camelKey = this.toCamelCase(key);

      if (this.isDateField(camelKey) && value) {
        formatted[camelKey] = new Date(value);
      } else {
        formatted[camelKey] = value;
      }
    });

    return formatted;
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private isDateField(fieldName: string): boolean {
    const dateFields = ['effectiveDate', 'terminationDate', 'modificationDate'];
    return dateFields.includes(fieldName);
  }
}