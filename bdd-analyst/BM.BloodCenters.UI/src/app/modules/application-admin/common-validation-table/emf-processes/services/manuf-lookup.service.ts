import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

interface TableColumnLookupDto {
  tableName: string;
  columnName: string;
}

export interface MappingNameLookupDto {
  mappingName: string;
  dataTableName: string;
  dataColumnName: string;
}

interface ProcessCodeLookupDto {
  processCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManufLookupService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all available table names for LOV
   */
  getTableNames(searchTerm?: string): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<string>>(API.APPLICATION_ADMIN.MANUF_LOOKUP_TABLES)
      .pipe(
        map(res => {
          const tables = res.data ?? [];
          if (searchTerm) {
            return tables.filter(table =>
              table.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          return tables;
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all column names for a specific table
   */
  getColumnNames(tableName: string): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<TableColumnLookupDto>>(
        API.APPLICATION_ADMIN.MANUF_LOOKUP_COLUMNS(tableName)
      )
      .pipe(
        map(res => {
          const columns = res.data ?? [];
          return columns.map(col => col.columnName);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all mapping names for a process code
   */
  getMappingNames(processCode: string): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<MappingNameLookupDto>>(
        API.APPLICATION_ADMIN.MANUF_LOOKUP_MAPPING_NAMES(processCode)
      )
      .pipe(
        map(res => {
          const mappings = res.data ?? [];
          return mappings.map(m => m.mappingName);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get full mapping lookup data (name, table, column) for a process code
   */
  getMappingLookups(processCode: string): Observable<MappingNameLookupDto[]> {
    return this.apiService
      .get<ReturnResult<MappingNameLookupDto>>(
        API.APPLICATION_ADMIN.MANUF_LOOKUP_MAPPING_NAMES(processCode)
      )
      .pipe(
        map(res => res.data ?? []),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all operator codes for LOV
   */
  getOperators(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<{ operator: string }>>(API.APPLICATION_ADMIN.EMF_OPERATORS)
      .pipe(
        map(res => {
          const operators = res.data ?? [];
          return operators.map(o => o.operator);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all action codes for LOV
   */
  getActionCodes(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<{ actionCode: string }>>(API.APPLICATION_ADMIN.EMF_ACTION_CODES)
      .pipe(
        map(res => {
          const actions = res.data ?? [];
          return actions.map(a => a.actionCode);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate a parent action sequence for a given process code
   */
  validateParentAction(processCode: string, actionSeq: string): Observable<boolean> {
    return this.apiService
      .get<ReturnResult<boolean>>(API.APPLICATION_ADMIN.EMF_VALIDATE_PARENT_ACTION(processCode, actionSeq))
      .pipe(
        map(res => {
          const data = res.data ?? [];
          return data.length > 0 && data[0] === true;
        }),
        catchError(() => of(false))
      );
  }

  /**
   * Get all process codes for LOV
   */
  getProcessCodes(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<ProcessCodeLookupDto>>(API.APPLICATION_ADMIN.MANUF_LOOKUP_PROCESS_CODES)
      .pipe(
        map(res => {
          const processCodes = res.data ?? [];
          return processCodes.map(p => p.processCode);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate that a table name exists and is accessible
   */
  validateTableName(tableName: string): Observable<boolean> {
    if (!tableName) {
      return of(false);
    }

    return this.getTableNames().pipe(
      map(tables => {
        const upperTableName = tableName.toUpperCase();
        return tables.some(table => table.toUpperCase() === upperTableName);
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Validate that a function name exists in UTIL.FCN with fcn_type = 'FRM'
   */
  validateFunctionName(functionName: string): Observable<boolean> {
    if (!functionName) {
      return of(false);
    }

    return this.apiService
      .get<ReturnResult<boolean>>(API.APPLICATION_ADMIN.EMF_VALIDATE_FUNCTION(functionName))
      .pipe(
        map(res => {
          const data = res.data ?? [];
          return data.length > 0 && data[0] === true;
        }),
        catchError(() => of(false))
      );
  }

  /**
   * Validate that a column name exists in the specified table
   */
  validateColumnName(tableName: string, columnName: string): Observable<boolean> {
    if (!tableName || !columnName) {
      return of(false);
    }

    return this.getColumnNames(tableName).pipe(
      map(columns => {
        const upperColumnName = columnName.toUpperCase();
        return columns.some(column => column.toUpperCase() === upperColumnName);
      }),
      catchError(() => of(false))
    );
  }
}
