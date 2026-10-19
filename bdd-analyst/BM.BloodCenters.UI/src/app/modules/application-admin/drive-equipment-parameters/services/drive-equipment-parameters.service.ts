import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import {
  DriveProfileModel,
  DriveProfileCreateDto,
  DriveProfileUpdateDto,
  DriveProfileFilterParams,
  DriveProfileTypeOption,
  DriveProfileCodeOption,
  QcParametersModel,
  QcParametersCreateDto,
  QcParametersUpdateDto,
  QcParametersFilterParams,
  QcParameterCodeOption,
  QcValueTypeOption,
  QcEquipmentTypeOption,
  QcDependencyModel,
  QcDependencyCreateDto,
  QcDependencyUpdateDto,
  QcDependencyFilterParams,
  QcDependencyParamCodeOption,
  PhysicalEquipmentModel,
  PhysicalEquipmentCreateDto,
  PhysicalEquipmentUpdateDto,
  PhysicalCodeOption,
  EquipmentTypeOption,
  PhysicalEquipmentFilterParams,
  MasterCodeModel
} from '../models/drive-equipment-parameters.model';
import { ApiService } from '@shared/services/api.service';
import { ValidMasterCodesService, MasterCodeItem } from '@shared/services/valid-master-codes.service';

interface ReturnResult<T> {
  Success?: boolean;
  Message?: string;
  Error?: string;
  StatusCode?: number;
  Data?: T[];
  Item?: T;
  Total?: number;
}

/**
 * API endpoints for Drive Equipment Parameters
 */
const DRIVE_EQUIPMENT_API = {
  // Drive Profile endpoints
  DRIVE_PROFILE_LIST: (take: number, skip: number) =>
    `/api/v1/admin/drive-profile/${take}/${skip}`,
  DRIVE_PROFILE_DEVICE_TYPES: '/api/v1/admin/drive-profile/device-types',
  DRIVE_PROFILE_TYPES: '/api/v1/admin/drive-profile/types',
  DRIVE_PROFILE_CODES: '/api/v1/admin/drive-profile/codes',
  DRIVE_PROFILE_CREATE: '/api/v1/admin/drive-profile',
  DRIVE_PROFILE_UPDATE: '/api/v1/admin/drive-profile',

  // QC Parameters endpoints
  QC_PARAMETERS_LIST: (take: number, skip: number) =>
    `/api/v1/admin/qc-parameters/${take}/${skip}`,
  QC_PARAMETERS_CODES: '/api/v1/admin/qc-parameters/qc-parameter-codes',
  QC_PARAMETERS_CHECK_CODES: '/api/v1/admin/qc-parameters/qc-check-codes',
  QC_PARAMETERS_EQUIPMENT_SUPPLY: '/api/v1/admin/qc-parameters/equipment-supply',
  QC_PARAMETERS_DATA_TYPES: '/api/v1/admin/qc-parameters/data-types',
  QC_PARAMETERS_VALUE_TYPES: '/api/v1/admin/qc-parameters/value-types',
  QC_PARAMETERS_TARGET_VALUES: '/api/v1/admin/qc-parameters/qc-target-values',
  QC_PARAMETERS_EQUIPMENT_TYPES: '/api/v1/admin/qc-parameters/equipment-types',
  QC_PARAMETERS_CREATE: '/api/v1/admin/qc-parameters',
  QC_PARAMETERS_UPDATE: '/api/v1/admin/qc-parameters',

  // QC Dependency endpoints
  QC_DEPENDENCY_LIST: (take: number, skip: number) =>
    `/api/v1/admin/qc-dependency/${take}/${skip}`,
  QC_DEPENDENCY_SOURCE_CODES: '/api/v1/admin/qc-dependency/source-param-codes',
  QC_DEPENDENCY_DEPENDENT_CODES: '/api/v1/admin/qc-dependency/dependent-param-codes',
  QC_DEPENDENCY_CREATE: '/api/v1/admin/qc-dependency',
  QC_DEPENDENCY_UPDATE: '/api/v1/admin/qc-dependency',

  // Physical Equipment endpoints
  PHYSICAL_EQUIPMENT_LIST: (take: number, skip: number) =>
    `/api/v1/admin/physical-equipment/${take}/${skip}`,
  PHYSICAL_EQUIPMENT_FILTERS: '/api/v1/admin/physical-equipment/filters',
  PHYSICAL_EQUIPMENT_CREATE: '/api/v1/admin/physical-equipment',
  PHYSICAL_EQUIPMENT_UPDATE: '/api/v1/admin/physical-equipment',
  PHYSICAL_EQUIPMENT_DELETE: (auditKey: number) => `/api/v1/admin/physical-equipment/${auditKey}`
};

/**
 * Service for managing Drive Equipment Parameters data
 * Handles CRUD operations for Drive Profile, QC Parameters, QC Dependency, and Physical Equipment
 */
@Injectable({
  providedIn: 'root'
})
export class DriveEquipmentParametersService {
  private readonly apiService = inject(ApiService);
  private readonly masterCodesService = inject(ValidMasterCodesService);

  // ============================================
  // DRIVE PROFILE METHODS
  // ============================================

  /**
   * Fetches Drive Profile records with pagination, search, and filters
   */
  getDriveProfiles(
    take: number,
    skip: number,
    params: DriveProfileFilterParams
  ): Observable<{ data: DriveProfileModel[]; totalRecords: number }> {
    const endpoint = DRIVE_EQUIPMENT_API.DRIVE_PROFILE_LIST(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => this.transformDriveProfileToCamelCase(item));
        return {
          data,
          totalRecords: response.total || 0
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new Drive Profile record
   */
  createDriveProfile(payload: DriveProfileCreateDto): Observable<any> {
    return this.apiService.post(DRIVE_EQUIPMENT_API.DRIVE_PROFILE_CREATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing Drive Profile record
   */
  updateDriveProfile(payload: DriveProfileUpdateDto): Observable<any> {
    return this.apiService.put(DRIVE_EQUIPMENT_API.DRIVE_PROFILE_UPDATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches device types dropdown
   */
  getDeviceTypes(): Observable<string[]> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.DRIVE_PROFILE_DEVICE_TYPES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches drive profile types dropdown
   */
  getDriveProfileTypes(): Observable<any[]> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.DRIVE_PROFILE_TYPES).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          code: item.code || item.Code,
          description: item.description || item.Description,
          codeType: item.codeType || item.CodeType,
          effectiveDate: item.effectiveDate || item.EffectiveDate
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches codes dropdown (optionally filtered by device type)
   */
  getCodes(deviceType?: string): Observable<any[]> {
    const options = deviceType
      ? { params: new HttpParams().set('deviceType', deviceType) }
      : undefined;
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.DRIVE_PROFILE_CODES, options).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          code: item.code || item.Code,
          description: item.description || item.Description,
          codeType: item.codeType || item.CodeType,
          effectiveDate: item.effectiveDate || item.EffectiveDate
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  private transformDriveProfileToCamelCase(item: any): DriveProfileModel {
    return {
      deviceType: item.deviceType || item.DeviceType,
      driveProfileType: item.driveProfileType || item.driveProfileCode || item.DriveProfileType || item.DriveProfileCode,
      driveProfileTypeDescription: item.driveProfileTypeDescription || item.DriveProfileTypeDescription,
      code: item.code || item.Code,
      codeDescription: item.codeDescription || item.CodeDescription,
      effectiveDate: item.effectiveDate || item.EffectiveDate,
      terminationDate: item.terminationDate || item.TerminationDate,
      modificationDate: item.modificationDate || item.ModificationDate || item.LastModifiedDate
    };
  }

  // ============================================
  // QC PARAMETERS METHODS
  // ============================================

  /**
   * Fetches QC Parameters records with pagination, search, and filters
   */
  getQcParameters(
    take: number,
    skip: number,
    params: QcParametersFilterParams
  ): Observable<{ data: QcParametersModel[]; totalRecords: number }> {
    const endpoint = DRIVE_EQUIPMENT_API.QC_PARAMETERS_LIST(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => {
        // API returns data in camelCase: { data: [...], total: 23 }
        const data = (response.data || []).map((item: any) => ({
          deviceType: item.deviceType,
          equipmentSupply: item.equipmentSupply,
          sortSequence: item.sortSequence,
          qcParameterCode: item.qcParameterCode,
          qcParameterDescription: item.qcParameterDescription,
          qcCheckCode: item.qcCheckCode,
          qcCheckDescription: item.qcCheckDescription,
          dataType: item.dataType,
          qcTargetValue: item.qcTargetValue,
          qcTargetValueDescription: item.qcTargetValueDescription,
          childSequence: item.childSequence,
          rangeFlag: item.rangeFlag,
          rangeDetailsValue: item.rangeDetailsValue,
          scanRequest: item.scanRequest,
          scanWhat: item.scanWhat,
          scanWhatDescription: item.scanWhatDescription,
          equipmentType: item.equipmentType,
          effectiveDate: item.effectiveDate,
          terminationDate: item.terminationDate,
          auditKey: item.auditKey,
          programId: item.programId,
          insertUser: item.insertUser,
          insertDate: item.insertDate
        } as QcParametersModel));
        return { data, totalRecords: response.total || 0 };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get QC parameter codes dropdown
   */
  getQcParameterCodes(): Observable<{ data: QcParameterCodeOption[]; totalRecords: number }> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_CODES).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description,
          codeType: item.codeType,
          effectiveDate: item.effectiveDate
        } as QcParameterCodeOption));
        return { data, totalRecords: response.total || data.length };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get QC check codes dropdown
   */
  getQcCheckCodes(): Observable<Array<{ code: string; description: string }>> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_CHECK_CODES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get equipment supply codes dropdown filtered by device type
   */
  getEquipmentSupplyCodes(deviceType: string): Observable<Array<{ code: string; description: string }>> {
    const options = {
      params: new HttpParams().set('deviceType', deviceType)
    };
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_EQUIPMENT_SUPPLY, options).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get data types dropdown
   */
  getQcDataTypes(): Observable<MasterCodeModel[]> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_DATA_TYPES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get value types dropdown
   */
  getQcValueTypes(): Observable<{ data: QcValueTypeOption[]; totalRecords: number }> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_VALUE_TYPES).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description,
          codeType: item.codeType,
          effectiveDate: item.effectiveDate
        } as QcValueTypeOption));
        return { data, totalRecords: response.total || data.length };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get QC target values dropdown
   */
  getQcTargetValues(): Observable<Array<{ code: string; description: string }>> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_TARGET_VALUES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get equipment types dropdown
   */
  getQcEquipmentTypes(): Observable<{ data: QcEquipmentTypeOption[]; totalRecords: number }> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_PARAMETERS_EQUIPMENT_TYPES).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description,
          codeType: item.codeType,
          effectiveDate: item.effectiveDate
        } as QcEquipmentTypeOption));
        return { data, totalRecords: response.total || data.length };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new QC Parameters record
   */
  createQcParameters(payload: QcParametersCreateDto): Observable<any> {
    return this.apiService.post(DRIVE_EQUIPMENT_API.QC_PARAMETERS_CREATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing QC Parameters record
   */
  updateQcParameters(payload: QcParametersUpdateDto): Observable<any> {
    return this.apiService.put(DRIVE_EQUIPMENT_API.QC_PARAMETERS_UPDATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ============================================
  // QC DEPENDENCY METHODS
  // ============================================

  /**
   * Fetches QC Dependency records with pagination, search, and filters
   */
  getQcDependencies(
    take: number,
    skip: number,
    params: QcDependencyFilterParams
  ): Observable<{ data: QcDependencyModel[]; totalRecords: number }> {
    const endpoint = DRIVE_EQUIPMENT_API.QC_DEPENDENCY_LIST(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          deviceType: item.deviceType,
          equipmentSupplyCode: item.equipmentSupplyCode,
          sourceParamCode: item.sourceParamCode,
          sourceParamDescription: item.sourceParamDescription,
          dependentCode: item.dependentCode,
          dependentDescription: item.dependentDescription,
          effectiveDate: item.effectiveDate,
          terminationDate: item.terminationDate,
          auditKey: item.auditKey,
          programId: item.programId,
          insertUser: item.insertUser,
          insertDate: item.insertDate
        } as QcDependencyModel));
        return { data, totalRecords: response.total || 0 };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get source parameter codes dropdown
   */
  getQcDependencySourceParamCodes(): Observable<{ data: QcDependencyParamCodeOption[]; totalRecords: number }> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_DEPENDENCY_SOURCE_CODES).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description,
          codeType: item.codeType,
          effectiveDate: item.effectiveDate
        } as QcDependencyParamCodeOption));
        return { data, totalRecords: response.total || data.length };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get dependent parameter codes dropdown
   */
  getQcDependencyDependentParamCodes(): Observable<{ data: QcDependencyParamCodeOption[]; totalRecords: number }> {
    return this.apiService.get<any>(DRIVE_EQUIPMENT_API.QC_DEPENDENCY_DEPENDENT_CODES).pipe(
      map(response => {
        const data = (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description,
          codeType: item.codeType,
          effectiveDate: item.effectiveDate
        } as QcDependencyParamCodeOption));
        return { data, totalRecords: response.total || data.length };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new QC Dependency record
   */
  createQcDependency(payload: QcDependencyCreateDto): Observable<any> {
    return this.apiService.post(DRIVE_EQUIPMENT_API.QC_DEPENDENCY_CREATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing QC Dependency record
   */
  updateQcDependency(payload: QcDependencyUpdateDto): Observable<any> {
    return this.apiService.put(DRIVE_EQUIPMENT_API.QC_DEPENDENCY_UPDATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ============================================
  // PHYSICAL EQUIPMENT METHODS (READ-ONLY)
  // ============================================

  /**
   * Fetches Physical Equipment records with pagination and filters
   */
  getPhysicalEquipment(
    take: number,
    skip: number,
    params: PhysicalEquipmentFilterParams
  ): Observable<{ data: PhysicalEquipmentModel[]; totalRecords: number }> {
    const endpoint = DRIVE_EQUIPMENT_API.PHYSICAL_EQUIPMENT_LIST(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => {
        // API returns data in camelCase: { data: [...], total: 23 }
        const data = (response.data || []).map((item: any) => ({
          physicalCode: item.physicalCode,
          physicalCodeDescription: item.physicalCodeDescription,
          equipmentType: item.equipmentType,
          equipmentTypeDescription: item.equipmentTypeDescription,
          effectiveDate: item.effectiveDate,
          terminationDate: item.terminationDate,
          auditKey: item.auditKey
        } as PhysicalEquipmentModel));

        return {
          data,
          totalRecords: response.total || 0
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches Physical Equipment filter dropdown options
   */
  getPhysicalEquipmentFilters(): Observable<ReturnResult<any>> {
    return this.apiService.get<ReturnResult<any>>(DRIVE_EQUIPMENT_API.PHYSICAL_EQUIPMENT_FILTERS).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches Physical Code dropdown options (VALID_MASTER_CODES code_type = 'PHYCD')
   */
  getPhysicalCodes(): Observable<PhysicalCodeOption[]> {
    return this.masterCodesService.getByCodeType('PHYCD').pipe(
      map(items => items.map(item => ({
        code: item.code,
        description: item.description,
        codeType: 'PHYCD'
      } as PhysicalCodeOption))),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches Equipment Type dropdown options for Physical Equipment (VALID_MASTER_CODES code_type = 'DREQP')
   */
  getEquipmentTypesForPhysical(): Observable<EquipmentTypeOption[]> {
    return this.masterCodesService.getByCodeType('DREQP').pipe(
      map(items => items.map(item => ({
        code: item.code,
        description: item.description,
        codeType: 'DREQP'
      } as EquipmentTypeOption))),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new Physical Equipment record
   */
  createPhysicalEquipment(payload: PhysicalEquipmentCreateDto): Observable<any> {
    return this.apiService.post(DRIVE_EQUIPMENT_API.PHYSICAL_EQUIPMENT_CREATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing Physical Equipment record
   */
  updatePhysicalEquipment(payload: PhysicalEquipmentUpdateDto): Observable<any> {
    return this.apiService.put(DRIVE_EQUIPMENT_API.PHYSICAL_EQUIPMENT_UPDATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Deletes a Physical Equipment record by auditKey
   */
  deletePhysicalEquipment(auditKey: number): Observable<any> {
    return this.apiService.delete(DRIVE_EQUIPMENT_API.PHYSICAL_EQUIPMENT_DELETE(auditKey)).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ============================================
  // DROPDOWN OPTIONS
  // ============================================

}
