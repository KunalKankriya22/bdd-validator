import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiService } from "../../../../shared/services/api.service";

/* =====================================================
   DTO / MODEL
===================================================== */

export interface DonorInterdiction {
  code: string;
  type: string;
  oldType?: string;
  owner: string;

  deferral?: string;
  fixedPeriod?: string;
  period?: string;

  value?: number;
  minValue?: number;

  multipleFlag?: string;
  upgradeFlag?: string;

  effectiveDate: string;        // calendar date, must be >= today (UTC) for add mode
  terminationDate?: string;     // calendar date, must be >= effectiveDate

  terminationReason?: string;
  viewLevel?: number;
  manualFlag?: string;
  labFlag?: string;
  changeControlFlag?: string;

  labInterdiction?: string;
  oldInterdiction?: string;
  donorInterdiction?: string;

  description?: string;
  lastModifiedDate?: string;
}

export interface DonorInterdictionSearchParams {
  owner?: string;
  interType?: string;
  deferralFlag?: string;

  effectivePeriod?: "BEFORE" | "AFTER";
  effectiveDate?: string;

  terminationPeriod?: "BEFORE" | "AFTER";
  terminationDate?: string;

  search?: string;

  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface InterdictionLookupItem {
  code: string;
  codeType: string;
  description: string;
}

export interface InterdictionLookupsResult {
  dropdowns: InterdictionDropdownDto;
  labFlags: LabFlagLookup[];
}

export interface InterdictionDropdownDto {
  types: string[];
  typeItems: InterdictionLookupItem[];
  owners: string[];
  fixedPeriods: string[];
  periods: string[];
  periodItems: InterdictionLookupItem[];
  labFlags: string[];
  viewLimit: number;
}

export interface LabFlagLookup {
  code: string;
  codeType: string;
  description: string;
}

export interface PagedResult<T> {
  success: boolean;
  statusCode: number;
  data: T[];
  total: number;
}

/* =====================================================
   API → UI MAPPER
===================================================== */

export function mapDonorInterdictionFromApi(api: any): DonorInterdiction {
  return {
    code: api.code ?? api.Code ?? api.INTER_CODE,
    type: api.type ?? api.Type ?? api.INTER_TYPE,
    owner: api.owner ?? api.Owner ?? api.INTER_OWNER,

    deferral: api.deferral ?? api.Deferral,
    fixedPeriod: api.fixedPeriod ?? api.FixedPeriod,
    period: api.period ?? api.Period,

    value: api.value ?? api.Value,
    minValue: api.minValue ?? api.MinValue,

    multipleFlag: api.multipleFlag ?? api.MultipleFlag,
    upgradeFlag: api.upgradeFlag ?? api.UpgradeFlag,

    effectiveDate: api.effectiveDate ?? api.EffectiveDate ?? api.EFF_DATE,
    terminationDate: api.terminationDate ?? api.TerminationDate ?? api.TERM_DATE,

    terminationReason: api.terminationReason ?? api.TerminationReason,
    viewLevel: api.viewLevel ?? api.ViewLevel,
    manualFlag: api.manualFlag ?? api.ManualFlag,
    labFlag: api.labFlag ?? api.LabFlag,
    changeControlFlag: api.changeControlFlag ?? api.ChangeControlFlag,

    labInterdiction: api.labInterdiction ?? api.LabInterdiction,
    oldInterdiction: api.oldInterdiction ?? api.OldInterdiction,
    donorInterdiction: api.donorInterdiction ?? api.DonorInterdiction,

    description: api.description ?? api.Description,
    lastModifiedDate: api.lastModifiedDate ?? api.LastModifiedDate
  };
}

/* =====================================================
   SERVICE
===================================================== */

@Injectable({
  providedIn: "root",
})
export class DonorInterdictionsService {

  private readonly endpoint = "api/v1/donor-interdictions";

  constructor(private apiService: ApiService) { }

  // -------------------------------------------------
  // GET ALL (NON-PAGED)
  // -------------------------------------------------
  getAll(): Observable<DonorInterdiction[]> {
    return this.apiService
      .get<any[]>(this.endpoint)
      .pipe(map(list => list.map(mapDonorInterdictionFromApi)));
  }

  // -------------------------------------------------
  // GET BY CODE (EDIT / VIEW)
  // -------------------------------------------------
  getByCode(code: string): Observable<DonorInterdiction> {
    return this.apiService
      .get<any>(`${this.endpoint}/${code}`)
      .pipe(map(mapDonorInterdictionFromApi));
  }

  // -------------------------------------------------
  // SEARCH + SORT + FILTER + PAGINATION
  // -------------------------------------------------
  searchSortFilter(
    take: number,
    skip: number,
    payload: DonorInterdictionSearchParams
  ): Observable<PagedResult<DonorInterdiction>> {
    return this.apiService
      .post<any>(
        `${this.endpoint}/search-sort-filter/${take}/${skip}`,
        payload
      )
      .pipe(
        map(res => ({
          success: res.Success,
          statusCode: res.StatusCode,
          data: res.Data.map(mapDonorInterdictionFromApi),
          total: res.Total
        }))
      );
  }


  // =================================================
  // ✅ NEW METHODS (ADDED)
  // =================================================

  // -------------------------------------------------
  // CREATE / SAVE DONOR INTERDICTION
  // POST: /save-donor-interdiction
  // -------------------------------------------------
  create(
    payload: DonorInterdiction
  ): Observable<string> {
    return this.apiService.post<string>(
      `${this.endpoint}/save-donor-interdiction`,
      payload,
      { responseType: 'text' as 'json' } // 🔑 KEY FIX
    );
  }

  // -------------------------------------------------
  // UPDATE DONOR INTERDICTION
  // PUT: /update-donor-interdiction
  // -------------------------------------------------
  update(
    payload: DonorInterdiction
  ): Observable<string> {
    return this.apiService.put(
      `${this.endpoint}/update-donor-interdiction`,
      payload,
      { responseType: 'text' as 'json' } // 🔑 KEY FIX
    );
  }


  // -------------------------------------------------
  // GET LOOKUP VALUES
  // GET: /lookups
  // -------------------------------------------------
  getLookups(): Observable<InterdictionLookupsResult> {
    return this.apiService.get<any>(`${this.endpoint}/lookups`).pipe(
      map(res => ({
        dropdowns: {
          types: (res.interTypes ?? []).map((item: InterdictionLookupItem) => item.code),
          typeItems: (res.interTypes ?? []) as InterdictionLookupItem[],
          owners: [],
          fixedPeriods: [],
          periods: (res.periodTypes ?? []).map((item: InterdictionLookupItem) => item.code),
          periodItems: (res.periodTypes ?? []) as InterdictionLookupItem[],
          labFlags: [],
          viewLimit: res.viewLimit ?? 0,
        } as InterdictionDropdownDto,
        labFlags: (res.labFlags ?? []) as LabFlagLookup[],
      }))
    );
  }

  // -------------------------------------------------
  // GET VIEW LIMIT
  // GET: /view-limit
  // -------------------------------------------------
  getViewLimit(): Observable<number> {
    return this.apiService.get<any>(`${this.endpoint}/view-limit`).pipe(
      map(res => {
        const viewLimitStr = res.item?.Viewlimit ?? res.item?.viewlimit ?? '0';
        return parseInt(viewLimitStr, 10) || 0;
      })
    );
  }
}
