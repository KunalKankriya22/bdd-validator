import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { ApiService } from "../../../../shared/services/api.service";
import { API } from "../../../../core/constants/api.constants";

export interface LookupCode {
  codeType: string;
  code: string;
  description: string;
}

export interface Chapter {
  /* ===== META ===== */
  InstitutionID?: string;
  LastModifiedDate?: any;

  /* ===== BASIC INFO ===== */
  chapterId?: string;
  chapterName: string;
  shortName: string;
  printHeader?: string;
  isbtStartDate: string | null; // ISO string
  taxId?: string;

  /* ===== OPERATIONAL ===== */
  unitScheme: string;
  sequenceCheckIn: boolean;
  qcForLabel: boolean;
  nursingAudit: boolean;
  testingChapter: boolean;
  donorCueScanned: boolean;

  /* ===== DATES ===== */
  effectiveDate: string; // ISO string
  terminationDate: string; // ISO string

  /* ===== ADDRESS ===== */
  isInternational: boolean;
  addressLine1: string;
  addressLine2?: string | null;
  addressLine3?: string | null;
  city: string;
  state?: string | null;
  zipCode: string;
  country: string;

  /* ===== CONTACT ===== */
  phoneNumber: string; // ✅ REQUIRED (FIXED)
  intlPhoneNumber?: string | null;
  fax?: string | null;
  intlFax?: string | null;

  /* ===== TIME & DURATION ===== */
  maxBleedTime: number;
  slowBleedTime: number;
  timeZone: string; // ✅ REQUIRED (FIXED)
  ffpFreezeDuration: number;
  aboBatchSize: number;
  sampleAge: number;
  companyNumber: string;
  cryoTimeLimit: number;
  altLevel: number;
  supAltLevel: number;

  /* ===== SEQUENCES ===== */
  batchSequence: number;
  cryoSequence: number;
  testBatchSequence: number;
  testKitSequence: number;
  sterileDocSequence: number;
  workNoSequence: number;
  driveSequence: number;
  groupSiteSequence: number;
  poolSequence: number;
  controlNumber: number;

  /* ===== PRODUCT MANAGEMENT ===== */
  tolerance?: string | null;
  labelReview: boolean;
  acceptExpiredReturns: boolean;
  pltHlaMatchReturn: boolean;
  rbcReducedPriceDays?: number | null;
  pltReturnableHrs: number;
  rbcReturnableDays: number;
  pltDesignatedReturn: boolean;
  rbcDesignatedReturn: boolean;
  orderLifetime?: number | null;
  maxDiscount?: number | null;
  rarityPercent: number;
  veryRarePercent?: number | null;
  quarantineAlertTime?: number | null;
  maxInventoryCheckIn: number;

  /* ===== FLAGS ===== */
  ffFlag: boolean;
  autoCross: boolean;
  directedCross: boolean;
}

export function mapChapterFromApi(api: any): Chapter {
  return {
    InstitutionID: api.InstId,
    LastModifiedDate: api.lastModifiedDate ? api.lastModifiedDate : api.insertDate,

    /* ===== BASIC INFO ===== */
    chapterId: api.chapterId,
    chapterName: api.chapterName,
    shortName: api.chapterShortName,
    printHeader: api.printHdr,
    isbtStartDate: api.isbtStartDate,
    taxId: api.taxId,

    /* ===== OPERATIONAL ===== */
    unitScheme: api.unitScheme,
    sequenceCheckIn: api.seqCheckinFlag === "Y",
    qcForLabel: api.qcLabelFlag === "Y",
    nursingAudit: api.nursingFlag === "Y",
    testingChapter: api.testChapterInd === "Y",
    donorCueScanned: api.cueScanFlag === "Y",

    /* ===== DATES ===== */
    effectiveDate: api.effDate,
    terminationDate: api.termDate,

    /* ===== ADDRESS ===== */
    isInternational: api.isInternational === "Y",
    addressLine1: api.addressLine1,
    addressLine2: api.addressLine2,
    addressLine3: api.addressLine3,
    city: api.city,
    state: api.state,
    zipCode: api.zipCode,
    country: api.country,

    /* ===== CONTACT ===== */
    phoneNumber: api.phoneNumber,
    intlPhoneNumber: api.intlPhoneNumber,
    fax: api.faxNumber,
    intlFax: api.telexNumber,

    /* ===== TIME & DURATION ===== */
    maxBleedTime: api.maxBleedTime,
    slowBleedTime: api.slowBleedTime,
    timeZone: api.timeZone,
    ffpFreezeDuration: api.ffpFreezeDurn,
    aboBatchSize: api.aborhBatchSize,
    sampleAge: api.sampleUnitDays,
    companyNumber: api.fiCompanyNo,
    cryoTimeLimit: api.cryoTimeLimit,
    altLevel: api.altELevel,
    supAltLevel: api.altSeLevel,

    /* ===== SEQUENCES ===== */
    batchSequence: api.batchSeq,
    cryoSequence: api.wsSeq,
    testBatchSequence: api.tbSeq,
    testKitSequence: api.testKitSeq,
    sterileDocSequence: api.sdcWsSeq,
    workNoSequence: api.workNumberSeq,
    driveSequence: Number(api.driveId),
    groupSiteSequence: Number(api.groupSiteId),
    poolSequence: api.poolSeq,
    controlNumber: api.fiControlNo,

    /* ===== PRODUCT MANAGEMENT ===== */
    tolerance: api.validateYyValue,
    labelReview: api.labelReviewFlag === "Y",
    acceptExpiredReturns: api.acceptExpired === "Y",
    pltHlaMatchReturn: api.pltHlaMatchReturn === "Y",
    rbcReducedPriceDays: api.rbcReducedPriceDays,
    pltReturnableHrs: api.pltReturnableHrs,
    rbcReturnableDays: api.rbcReturnableDays,
    pltDesignatedReturn: api.pltDesignatedReturn === "Y",
    rbcDesignatedReturn: api.rbcDesignatedReturn === "Y",
    orderLifetime: api.orderMinLifetime,
    maxDiscount: api.maxDiscountPct,
    rarityPercent: api.rarityPercent,
    veryRarePercent: api.vRarityPercent,
    quarantineAlertTime: api.quarantineAlertTime,
    maxInventoryCheckIn: api.maxInvChkDays,

    /* ===== FLAGS ===== */
    ffFlag: api.validateFfValue === "Y",
    autoCross: api.autoCrossAllowed === "Y",
    directedCross: api.directedCrossAllowed === "Y",
  };
}

@Injectable({
  providedIn: "root",
})
export class Chapters {
  constructor(private apiService: ApiService) { }

  /**
   * Create Chapter
   */
  createChapter(payload: Chapter): Observable<Chapter> {
    return this.apiService.post<Chapter>(API.CHAPTER.GET, payload);
  }

  /**
   * Update Chapter
   */
  updateChapter(id: string, payload: Chapter): Observable<Chapter> {
    return this.apiService.put<Chapter>(`${API.CHAPTER.GET}/${id}`, payload);
  }

  /**
   * Get Chapter by ID
   */
  getChapterById(id: string): Observable<Chapter> {
    return this.apiService
      .get<any>(`${API.CHAPTER.GET}/${id}`)
      .pipe(map(mapChapterFromApi));
  }

  /**
   * Get all Chapters
   */
  getChapters(): Observable<Chapter[]> {
    return this.apiService.get<Chapter[]>(API.CHAPTER.GET);
  }

  /**
   * Delete Chapter
   */
  deleteChapter(id: string): Observable<void> {
    return this.apiService.delete<void>(`${API.CHAPTER.GET}/${id}`);
  }

  /**
   * Get States Lookup
   */
  getStatesLookup(): Observable<LookupCode[]> {
    return this.apiService.get<LookupCode[]>(API.CHAPTER.STATES_LOOKUP);
  }

  /**
   * Get Countries Lookup
   */
  getCountriesLookup(): Observable<LookupCode[]> {
    return this.apiService.get<LookupCode[]>(API.CHAPTER.COUNTRIES_LOOKUP);
  }

  /**
   * Get Time Zones Lookup
   */
  getTimeZonesLookup(): Observable<LookupCode[]> {
    return this.apiService.get<LookupCode[]>(API.CHAPTER.TIMEZONES_LOOKUP);
  }
}
