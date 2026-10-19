import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import { UnitQueryResult, ComponentResult, UnitTestDetail, UnitTestDetailCombined, UnitNote, FreezeDetail } from './unit-query.model';

interface ApiResponse<T> {
  data: T[];
  total: number;
  success: boolean;
  message: string;
  statusCode: number;
  Data?: T[];
  Total?: number;
  Success?: boolean;
  Message?: string;
  StatusCode?: number;
}

@Injectable({ providedIn: 'root' })
export class UnitQueryService {
  private readonly http = inject(HttpClient);

  getByUnitId(unitId: string, collDate?: string): Observable<UnitQueryResult | null> {
    let params = new HttpParams();
    if (collDate) {
      params = params.set('collDate', collDate);
    }
    return this.http
      .get<ApiResponse<UnitQueryResult>>(API.UNIT_QUERY.GET_BY_UNIT_ID(unitId), { params })
      .pipe(
        map((res) => {
          const data = res.data ?? res.Data ?? [];
          return data.length > 0 ? this.normalizeUnit(data[0]) : null;
        }),
      );
  }

  getByOsUnitId(osUnitId: string, receivedDate?: string): Observable<UnitQueryResult[]> {
    let params = new HttpParams();
    if (receivedDate) {
      params = params.set('receivedDate', receivedDate);
    }
    return this.http
      .get<ApiResponse<UnitQueryResult>>(API.UNIT_QUERY.GET_BY_OS_UNIT_ID(osUnitId), { params })
      .pipe(
        map((res) => {
          const data = res.data ?? res.Data ?? [];
          return data.map((u) => this.normalizeUnit(u));
        }),
      );
  }

  getComponents(unitId: string, collDate: string): Observable<ComponentResult[]> {
    const params = new HttpParams().set('collDate', collDate);
    return this.http
      .get<ApiResponse<ComponentResult>>(API.UNIT_QUERY.GET_COMPONENTS(unitId), { params })
      .pipe(
        map((res) => {
          const data = res.data ?? res.Data ?? [];
          return data.map((c) => this.normalizeComponent(c));
        }),
      );
  }

  getUnitTestDetails(unitId: string, collDate: string): Observable<UnitTestDetailCombined> {
    const params = new HttpParams().set('collDate', collDate);
    return this.http
      .get<{ item?: UnitTestDetailCombined; Item?: UnitTestDetailCombined }>(API.UNIT_QUERY.GET_UNIT_TEST_DETAILS(unitId), { params })
      .pipe(map((res) => {
        const item = res.item ?? res.Item ?? { scheduledTests: [], unscheduledTests: [] };
        return {
          scheduledTests: item.scheduledTests ?? item.ScheduledTests ?? [],
          unscheduledTests: item.unscheduledTests ?? item.UnscheduledTests ?? [],
        };
      }));
  }

  getUnitNotes(unitId: string, collDate: string): Observable<UnitNote[]> {
    const params = new HttpParams().set('collDate', collDate);
    return this.http
      .get<ApiResponse<UnitNote>>(API.UNIT_QUERY.GET_UNIT_NOTES(unitId), { params })
      .pipe(map((res) => res.data ?? res.Data ?? []));
  }

  getComponentNotes(unitId: string, collDate: string, productCode: string): Observable<UnitNote[]> {
    const params = new HttpParams().set('collDate', collDate).set('productCode', productCode);
    return this.http
      .get<ApiResponse<UnitNote>>(API.UNIT_QUERY.GET_COMPONENT_NOTES(unitId), { params })
      .pipe(map((res) => res.data ?? res.Data ?? []));
  }

  getFreezeDetails(unitId: string, collDate: string, productCode: string): Observable<FreezeDetail[]> {
    const params = new HttpParams().set('collDate', collDate).set('productCode', productCode);
    return this.http
      .get<ApiResponse<FreezeDetail>>(API.UNIT_QUERY.GET_FREEZE_DETAILS(unitId), { params })
      .pipe(map((res) => res.data ?? res.Data ?? []));
  }

  getAddOnBags(unitId: string, collDate: string): Observable<any[]> {
    const params = new HttpParams().set('collDate', collDate);
    return this.http
      .get<ApiResponse<any>>(`/api/v1/unit-query/${encodeURIComponent(unitId)}/add-on-bags`, { params })
      .pipe(map((res) => res.data ?? res.Data ?? []));
  }

  getEquipmentSupply(unitId: string, collDate: string): Observable<{ componentCgmpRecords: any[]; equipmentRecords: any[]; supplyRecords: any[]; driveId: string | null }> {
    const params = new HttpParams().set('collDate', collDate);
    return this.http
      .get<any>(`/api/v1/unit-query/${encodeURIComponent(unitId)}/equipment-supply`, { params })
      .pipe(map((res) => {
        const item = (res?.data ?? res?.Data ?? [])[0] ?? {};
        return {
          componentCgmpRecords: item.componentCgmpRecords ?? item.ComponentCgmpRecords ?? [],
          equipmentRecords: item.equipmentRecords ?? item.EquipmentRecords ?? [],
          supplyRecords: item.supplyRecords ?? item.SupplyRecords ?? [],
          driveId: item.driveId ?? item.DriveId ?? null,
        };
      }));
  }

  getPathogenReduction(unitId: string, collDate: string, productCode?: string): Observable<any[]> {
    let params = new HttpParams().set('collDate', collDate);
    if (productCode) {
      params = params.set('productCode', productCode);
    }
    return this.http
      .get<ApiResponse<any>>(`/api/v1/unit-query/${encodeURIComponent(unitId)}/pathogen-reduction`, { params })
      .pipe(map((res) => res.data ?? res.Data ?? []));
  }

  private normalizeUnit(u: any): UnitQueryResult {
    return {
      unitId: u.unitId ?? u.UnitId ?? '',
      collDate: u.collDate ?? u.CollDate ?? '',
      chapterId: u.chapterId ?? u.ChapterId ?? '',
      osUnitId: u.osUnitId ?? u.OsUnitId ?? null,
      receivedDate: u.receivedDate ?? u.ReceivedDate ?? null,
      contractId: u.contractId ?? u.ContractId ?? null,
      contractName: u.contractName ?? u.ContractName ?? null,
      driveId: u.driveId ?? u.DriveId ?? null,
      batchId: u.batchId ?? u.BatchId ?? null,
      warehouseId: u.warehouseId ?? u.WarehouseId ?? null,
      groupSiteId: u.groupSiteId ?? u.GroupSiteId ?? null,
      siteName: u.siteName ?? u.SiteName ?? null,
      bleedStartTime: u.bleedStartTime ?? u.BleedStartTime ?? null,
      bleedEndTime: u.bleedEndTime ?? u.BleedEndTime ?? null,
      bleedDuration: u.bleedDuration ?? u.BleedDuration ?? null,
      priorAbo: u.priorAbo ?? u.PriorAbo ?? null,
      priorAboDescription: u.priorAboDescription ?? u.PriorAboDescription ?? null,
      testedAbo: u.testedAbo ?? u.TestedAbo ?? null,
      testedAboDescription: u.testedAboDescription ?? u.TestedAboDescription ?? null,
      systemLabelDecision: u.systemLabelDecision ?? u.SystemLabelDecision ?? null,
      numberOfBags: u.numberOfBags ?? u.NumberOfBags ?? null,
      catalogNumber: u.catalogNumber ?? u.CatalogNumber ?? null,
      lotNumber: u.lotNumber ?? u.LotNumber ?? null,
      donorDecisionCode: u.donorDecisionCode ?? u.DonorDecisionCode ?? null,
      donorDecisionCodeDescription: u.donorDecisionCodeDescription ?? u.DonorDecisionCodeDescription ?? null,
      bagCode: u.bagCode ?? u.BagCode ?? null,
      nursingAuditStatus: u.nursingAuditStatus ?? u.NursingAuditStatus ?? null,
      nursingAuditFlag: u.nursingAuditFlag ?? u.NursingAuditFlag ?? null,
      donorLabDats: u.donorLabDats ?? u.DonorLabDats ?? null,
      labDistDats: u.labDistDats ?? u.LabDistDats ?? null,
      qcCheckinFlag: u.qcCheckinFlag ?? u.QcCheckinFlag ?? null,
      qcCheckinDate: u.qcCheckinDate ?? u.QcCheckinDate ?? null,
      qcLabelFlag: u.qcLabelFlag ?? u.QcLabelFlag ?? null,
      qcLabelDate: u.qcLabelDate ?? u.QcLabelDate ?? null,
      redTubeFlag: u.redTubeFlag ?? u.RedTubeFlag ?? null,
      redTube2: u.redTube2 ?? u.RedTube2 ?? null,
      purpleTubeFlag: u.purpleTubeFlag ?? u.PurpleTubeFlag ?? null,
      serumPlasmaInd: u.serumPlasmaInd ?? u.SerumPlasmaInd ?? null,
      checkDigit: u.checkDigit ?? u.CheckDigit ?? null,
      unitSchemeType: u.unitSchemeType ?? u.UnitSchemeType ?? null,
      testMessage: u.testMessage ?? u.TestMessage ?? null,
      firstSepTime: u.firstSepTime ?? u.FirstSepTime ?? null,
      secondSepTime: u.secondSepTime ?? u.SecondSepTime ?? null,
      thirdSepTime: u.thirdSepTime ?? u.ThirdSepTime ?? null,
      firstSepCentrifugeId: u.firstSepCentrifugeId ?? u.FirstSepCentrifugeId ?? null,
      secondSepCentrifugeId: u.secondSepCentrifugeId ?? u.SecondSepCentrifugeId ?? null,
      thirdSepCentrifugeId: u.thirdSepCentrifugeId ?? u.ThirdSepCentrifugeId ?? null,
      firstSepUserId: u.firstSepUserId ?? u.FirstSepUserId ?? null,
      secondSepUserId: u.secondSepUserId ?? u.SecondSepUserId ?? null,
      thirdSepUserId: u.thirdSepUserId ?? u.ThirdSepUserId ?? null,
      firstSepWeight: u.firstSepWeight ?? u.FirstSepWeight ?? null,
      secondSepWeight: u.secondSepWeight ?? u.SecondSepWeight ?? null,
      thirdSepWeight: u.thirdSepWeight ?? u.ThirdSepWeight ?? null,
      firstSepEntryMode: u.firstSepEntryMode ?? u.FirstSepEntryMode ?? null,
      secondSepEntryMode: u.secondSepEntryMode ?? u.SecondSepEntryMode ?? null,
      thirdSepEntryMode: u.thirdSepEntryMode ?? u.ThirdSepEntryMode ?? null,
      firstSepDuration: u.firstSepDuration ?? u.FirstSepDuration ?? null,
      secondSepDuration: u.secondSepDuration ?? u.SecondSepDuration ?? null,
      thirdSepDuration: u.thirdSepDuration ?? u.ThirdSepDuration ?? null,
      noteId: u.noteId ?? u.NoteId ?? null,
      hasAttributes: u.hasAttributes ?? u.HasAttributes ?? false,
      hasInterdictions: u.hasInterdictions ?? u.HasInterdictions ?? false,
      hasTests: u.hasTests ?? u.HasTests ?? false,
      hasComponents: u.hasComponents ?? u.HasComponents ?? false,
      isArchived: u.isArchived ?? u.IsArchived ?? false,
      hasDocuments: u.hasDocuments ?? u.HasDocuments ?? false,
      hasPathogenDetails: u.hasPathogenDetails ?? u.HasPathogenDetails ?? false,
      hasFreezeDetails: u.hasFreezeDetails ?? u.HasFreezeDetails ?? false,
      hasAddOnBags: u.hasAddOnBags ?? u.HasAddOnBags ?? false,
      hasAntigensPermission: u.hasAntigensPermission ?? u.HasAntigensPermission ?? false,
    };
  }

  private normalizeComponent(c: any): ComponentResult {
    return {
      unitId: c.unitId ?? c.UnitId ?? '',
      collDate: c.collDate ?? c.CollDate ?? '',
      chapterId: c.chapterId ?? c.ChapterId ?? '',
      componentPrefix: c.componentPrefix ?? c.ComponentPrefix ?? null,
      productCode: c.productCode ?? c.ProductCode ?? null,
      productDescription: c.productDescription ?? c.ProductDescription ?? null,
      productType: c.productType ?? c.ProductType ?? null,
      systemLabelDecision: c.systemLabelDecision ?? c.SystemLabelDecision ?? null,
      systemLabelDecisionDescription:
        c.systemLabelDecisionDescription ?? c.SystemLabelDecisionDescription ?? null,
      expirationDate: c.expirationDate ?? c.ExpirationDate ?? null,
      rejectReasonCode: c.rejectReasonCode ?? c.RejectReasonCode ?? null,
      bagsUsed: c.bagsUsed ?? c.BagsUsed ?? null,
      invProductType: c.invProductType ?? c.InvProductType ?? null,
      componentStatus: c.componentStatus ?? c.ComponentStatus ?? null,
      componentStatusDescription:
        c.componentStatusDescription ?? c.ComponentStatusDescription ?? null,
      noteId: c.noteId ?? c.NoteId ?? null,
      warehouseId: c.warehouseId ?? c.WarehouseId ?? null,
      hasAttributes: c.hasAttributes ?? c.HasAttributes ?? false,
      hasInterdictions: c.hasInterdictions ?? c.HasInterdictions ?? false,
      bagId: c.bagId ?? c.BagId ?? null,
    };
  }
}
