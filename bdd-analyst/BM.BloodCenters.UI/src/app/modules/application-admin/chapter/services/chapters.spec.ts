import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Chapters, Chapter, mapChapterFromApi } from './chapters';
import { ApiService } from '../../../../shared/services/api.service';

describe('Chapters Service', () => {
  let service: Chapters;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<ApiService>('ApiService', [
      'get',
      'post',
      'put',
      'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        Chapters,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(Chapters);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  /* ===============================
     CREATE CHAPTER
  =============================== */
  it('should call POST to create chapter', () => {
    const payload = {} as Chapter;
    apiServiceSpy.post.and.returnValue(of(payload));

    service.createChapter(payload).subscribe(result => {
      expect(result).toEqual(payload);
    });

    expect(apiServiceSpy.post).toHaveBeenCalledWith('/api/v1/chapters', payload);
  });

  /* ===============================
     UPDATE CHAPTER
  =============================== */
  it('should call PUT to update chapter', () => {
    const payload = {} as Chapter;

    apiServiceSpy.put.and.returnValue(of(payload));

    service.updateChapter('ABC', payload).subscribe(result => {
      expect(result).toEqual(payload);
    });

    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      '/api/v1/chapters/ABC',
      payload
    );
  });

  /* ===============================
     DELETE CHAPTER
  =============================== */
  it('should call DELETE to remove chapter', () => {
    apiServiceSpy.delete.and.returnValue(of(void 0));

    service.deleteChapter('ABC').subscribe();

    expect(apiServiceSpy.delete).toHaveBeenCalledWith('/api/v1/chapters/ABC');
  });

  /* ===============================
     GET ALL CHAPTERS
  =============================== */
  it('should fetch all chapters', () => {
    const chapters: Chapter[] = [];
    apiServiceSpy.get.and.returnValue(of(chapters));

    service.getChapters().subscribe(result => {
      expect(result).toEqual(chapters);
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/chapters');
  });

  /* ===============================
     GET CHAPTER BY ID + MAPPING
  =============================== */
  it('should fetch chapter by id and map API response', () => {
    const apiResponse = {
      InstId: 'INST',
      chapterId: 'ABC',
      chapterName: 'Test Chapter',
      chapterShortName: 'TC',
      printHdr: 'Header',
      isbtStartDate: '2025-02-02T00:00:00Z',
      taxId: '123',
      unitScheme: 'N',
      seqCheckinFlag: 'Y',
      qcLabelFlag: 'Y',
      nursingFlag: 'N',
      testChapterInd: 'Y',
      cueScanFlag: 'N',
      effDate: '2025-01-01',
      termDate: '2030-01-01',
      isInternational: 'N',
      addressLine1: 'Street',
      city: 'Dallas',
      zipCode: '75201',
      country: 'USA',
      phoneNumber: '1234567890',
      timeZone: '-06:00',
      maxBleedTime: 10,
      slowBleedTime: 5,
      ffpFreezeDurn: 1.25,
      aborhBatchSize: 10,
      sampleUnitDays: 30,
      fiCompanyNo: '01',
      cryoTimeLimit: 8.56,
      altELevel: 10,
      altSeLevel: 20,
      batchSeq: 1000,
      tbSeq: 1000,
      wsSeq: 1000,
      testKitSeq: 1000,
      sdcWsSeq: 1000,
      workNumberSeq: 1000,
      driveId: '1',
      groupSiteId: '2',
      poolSeq: 1000,
      fiControlNo: 1000,
      validateYyValue: '+1',
      labelReviewFlag: 'Y',
      acceptExpired: 'Y',
      pltHlaMatchReturn: 'N',
      rbcReducedPriceDays: 3,
      pltReturnableHrs: 24,
      rbcReturnableDays: 35,
      pltDesignatedReturn: 'Y',
      rbcDesignatedReturn: 'N',
      orderMinLifetime: 30,
      maxDiscountPct: 10,
      rarityPercent: 5,
      vRarityPercent: 2,
      quarantineAlertTime: 48,
      maxInvChkDays: 30,
      validateFfValue: 'Y',
      autoCrossAllowed: 'Y',
      directedCrossAllowed: 'N'
    };

    apiServiceSpy.get.and.returnValue(of(apiResponse));

    service.getChapterById('ABC').subscribe(result => {
      expect(result.chapterId).toBe('ABC');
      expect(result.sequenceCheckIn).toBeTrue();
      expect(result.ffFlag).toBeTrue();
      expect(result.directedCross).toBeFalse();
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/chapters/ABC');
  });
});

/* ===============================
   MAPPER UNIT TEST
=============================== */
describe('mapChapterFromApi()', () => {
  it('should correctly map Y/N flags to booleans', () => {
    const api = {
      seqCheckinFlag: 'Y',
      qcLabelFlag: 'N',
      nursingFlag: 'Y',
      testChapterInd: 'N',
      cueScanFlag: 'Y',
      isInternational: 'N',
      labelReviewFlag: 'Y',
      acceptExpired: 'N',
      pltDesignatedReturn: 'Y',
      rbcDesignatedReturn: 'N',
      validateFfValue: 'Y',
      autoCrossAllowed: 'N',
      directedCrossAllowed: 'Y'
    };

    const result = mapChapterFromApi(api);

    expect(result.sequenceCheckIn).toBeTrue();
    expect(result.qcForLabel).toBeFalse();
    expect(result.nursingAudit).toBeTrue();
    expect(result.testingChapter).toBeFalse();
    expect(result.donorCueScanned).toBeTrue();
    expect(result.isInternational).toBeFalse();
    expect(result.labelReview).toBeTrue();
    expect(result.acceptExpiredReturns).toBeFalse();
    expect(result.pltDesignatedReturn).toBeTrue();
    expect(result.rbcDesignatedReturn).toBeFalse();
    expect(result.ffFlag).toBeTrue();
    expect(result.autoCross).toBeFalse();
    expect(result.directedCross).toBeTrue();
  });
});
