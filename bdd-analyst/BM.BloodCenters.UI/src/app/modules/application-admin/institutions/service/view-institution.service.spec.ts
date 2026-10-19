import { TestBed } from '@angular/core/testing';
import { ViewInstitutionService, ChaptersApiResponse } from './view-institution.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../app/core/constants/api.constants';
import { of } from 'rxjs';
import { ViewInstitution } from '../interfaces/view-institution.interface';
import { ChapterModel } from '../../../application-admin/institutions/view-institution/view-institution';

describe('ViewInstitutionService', () => {
  let service: ViewInstitutionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInstitutions: ViewInstitution[] = [
    {
      insT_ID: 'INST001',
      insT_NAME: 'Test Institution 1',
      insT_SHORT_NAME: 'TI1',
      addresS_ID: 1,
      prinT_HDR: 'Header 1',
      systeM_NAME: 'System 1',
      codabaR_UNIT_SCHEME: 'A',
      taX_ID: '123456789',
      reG_NO: 'REG001',
      liC_NO: 'LIC001',
      contracT_PREFIX: 'TI1',
      prograM_ID: 'BLOOD',
      audiT_KEY: 1,
      efF_DATE: '2024-01-01',
      lasT_MODIFIED_DATE: '2024-01-15',
      addR_1: '123 Main St',
      addR_2: 'Suite 100',
      addR_3: undefined,
      city: 'New York',
      statE_CODE: 'NY',
      zip: '10001',
      country: 'USA',
      phonE_NUMBER: '1234567890',
      inT_PHONE_NUMBER: undefined,
      faX_NUMBER: undefined,
      teleX_NUMBER: undefined,
      inT_FLAG: 'N'
    },
    {
      insT_ID: 'INST002',
      insT_NAME: 'Test Institution 2',
      insT_SHORT_NAME: 'TI2',
      addresS_ID: 2,
      prinT_HDR: 'Header 2',
      systeM_NAME: 'System 2',
      codabaR_UNIT_SCHEME: 'N',
      taX_ID: '987654321',
      reG_NO: 'REG002',
      liC_NO: 'LIC002',
      contracT_PREFIX: 'TI2',
      prograM_ID: 'BLOOD',
      audiT_KEY: 2,
      efF_DATE: '2024-02-01',
      lasT_MODIFIED_DATE: '2024-02-15',
      addR_1: '456 Oak Ave',
      city: 'Los Angeles',
      statE_CODE: 'CA',
      zip: '90001',
      country: 'USA',
      phonE_NUMBER: '9876543210',
      inT_FLAG: 'N'
    }
  ];

  const mockChapters: ChapterModel[] = [
    {
      chapterId: 'CH001',
      chapterName: 'Chapter 1',
      chapterShortName: 'C1',
      addressId: 1,
      printHdr: 'Print Header 1',
      testChapterInd: 'N',
      instId: 'INST001',
      effDate: '2024-01-01',
      lastModifiedDate: '2024-01-15',
      termDate: undefined,
      auditKey: 1,
      programId: 'BLOOD',
      timeZone: '+00:00',
      insertDate: '2024-01-01',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      isInternational: 'N'
    },
    {
      chapterId: 'CH002',
      chapterName: 'Chapter 2',
      chapterShortName: 'C2',
      addressId: 2,
      printHdr: 'Print Header 2',
      testChapterInd: 'Y',
      instId: 'INST002',
      effDate: '2024-02-01',
      lastModifiedDate: '2024-02-15',
      termDate: '2025-12-31',
      auditKey: 2,
      programId: 'BLOOD',
      timeZone: '+00:00',
      insertDate: '2024-02-01',
      addressLine1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      isInternational: 'N'
    }
  ];

  const mockChaptersApiResponse: ChaptersApiResponse = {
    success: true,
    message: 'Successfully fetched active chapters',
    statusCode: 200,
    data: mockChapters
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);

        service = new ViewInstitutionService(apiSpy as any);
    apiServiceSpy = apiSpy;
  });


  describe('getInstitutions', () => {
    it('should call ApiService.get with correct endpoint', () => {
      apiServiceSpy.get.and.returnValue(of(mockInstitutions));

      service.getInstitutions().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.INSTITUTION.GET);
    });

    it('should return institutions observable', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockInstitutions));

      service.getInstitutions().subscribe(institutions => {
        expect(institutions).toEqual(mockInstitutions);
        expect(institutions.length).toBe(2);
        expect(institutions[0].insT_ID).toBe('INST001');
        done();
      });
    });


  });

  describe('getChapters', () => {
    it('should call ApiService.get with correct endpoint', () => {
      apiServiceSpy.get.and.returnValue(of(mockChaptersApiResponse));

      service.getChapters().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.INSTITUTION.ALL_CHAPTERS);
    });

    it('should return chapters observable and extract data array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockChaptersApiResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockChapters);
        expect(chapters.length).toBe(2);
        expect(chapters[0].chapterId).toBe('CH001');
        done();
      });
    });





    it('should handle response where data is already an array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockChapters as any));

      service.getChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockChapters);
        expect(chapters.length).toBe(2);
        done();
      });
    });
  });
});
