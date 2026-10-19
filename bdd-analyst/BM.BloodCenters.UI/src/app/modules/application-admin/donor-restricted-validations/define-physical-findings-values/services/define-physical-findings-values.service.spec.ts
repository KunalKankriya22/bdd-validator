import { TestBed } from '@angular/core/testing';
import { DefinePhysicalFindingsValuesService } from './define-physical-findings-values.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DefinePhysicalFindingsValuesParamsDto,
  PhysicalRuleFormData
} from '../models/define-physical-findings-values.model';

describe('DefinePhysicalFindingsValuesService', () => {
  let service: DefinePhysicalFindingsValuesService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockResponse = {
    data: [
      {
        physicalCode: 'AGE',
        physicalCodeDescription: 'Donor age not acceptable',
        dataType: 'N',
        itemValue: '11',
        itemValueMax: '112',
        itemOperator: 'BETWEEN',
        gender: 'A',
        fromAge: 11,
        toAge: 111,
        interCode: '00008',
        interdictionDescription: 'Test Interdiction 1',
        equipType: '1000',
        equipmentTypeDescription: 'Equipment Type 1000',
        commentReqFlag: 'Y',
        manualAuditFlag: 'Y',
        effDate: '2026-04-02T13:00:00',
        termDate: '2026-04-29T13:00:00',
        donationType: 'UAT2',
        donationTypeDescription: 'LOCAL TIME TESTING UAT 2',
        procedureCode: 'm9',
        procedureCodeDescription: 'test m9'
      }
    ],
    totalCount: 1
  };

  const mockLookups = {
    donationTypes: [
      { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' },
      { key: 'DI', value: 'Directed' }
    ],
    procedureCodes: [
      { key: 'm9', value: 'test m9' },
      { key: 'WB', value: 'Whole Blood' }
    ],
    physicalCodes: [
      { key: 'AGE', value: 'Donor age not acceptable' },
      { key: 'PULEV', value: 'Pulse Evaluation' }
    ],
    interdictionCodes: [
      { key: '00008', value: 'Test Interdiction 1' },
      { key: '00009', value: 'Test Interdiction 2' }
    ],
    equipmentTypes: [
      { key: '500', value: 'Equipment Type 500' },
      { key: '1000', value: 'Equipment Type 1000' }
    ]
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    mockHeaderService = createMockHeaderService();
    TestBed.configureTestingModule({
      providers: [
        DefinePhysicalFindingsValuesService,
        { provide: ApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    service = TestBed.inject(DefinePhysicalFindingsValuesService);
  });

  describe('getDefinePhysicalFindingsValues', () => {
    it('should fetch physical findings values with default parameters', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const take = 25;
      const skip = 0;
      const params: DefinePhysicalFindingsValuesParamsDto = {};

      service.getDefinePhysicalFindingsValues(take, skip, params).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].physicalCode).toBe('AGE');
        expect(mockApiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should include filter parameters in the request', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const take = 50;
      const skip = 25;
      const params: DefinePhysicalFindingsValuesParamsDto = {
        donationType: 'UAT2',
        procedureCode: 'm9',
        searchKeyword: 'AGE',
        operator: 'BETWEEN',
        interdiction: '00008',
        sort: 'A'
      };

      service.getDefinePhysicalFindingsValues(take, skip, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args;
        expect(callArgs[1].take).toBe(50);
        expect(callArgs[1].skip).toBe(25);
        expect(callArgs[1].donationType).toBe('UAT2');
        expect(callArgs[1].procedureCode).toBe('m9');
        expect(callArgs[1].searchKeyword).toBe('AGE');
        expect(callArgs[1].itemOperator).toBe('BETWEEN');
        expect(callArgs[1].interCode).toBe('00008');
        done();
      });
    });

    it('should set sortOrder to DESC when sort param is D', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { sort: 'D' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.sortOrder).toBe('DESC');
        done();
      });
    });

    it('should set sortOrder to ASC when sort param is A', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { sort: 'A' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.sortOrder).toBe('ASC');
        done();
      });
    });

    it('should not set sortOrder when sort param is not provided', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefinePhysicalFindingsValues(25, 0, {}).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.sortOrder).toBeUndefined();
        done();
      });
    });

    it('should map manualAuditFindingsFlag Y to manualAuditFlag Y', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { manualAuditFindingsFlag: 'Y' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBe('Y');
        done();
      });
    });

    it('should map manualAuditFindingsFlag non-Y to manualAuditFlag NULL', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { manualAuditFindingsFlag: 'N' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBe('NULL');
        done();
      });
    });

    it('should map equipmentType to equipType in request', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { equipmentType: '500' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.equipType).toBe('500');
        done();
      });
    });

    it('should map effectiveDate to effDate in request', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { effectiveDate: '2026-01-01' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.effDate).toBe('2026-01-01');
        done();
      });
    });

    it('should include effectivePeriod in request when provided', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { effectivePeriod: 'After' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.effectivePeriod).toBe('After');
        done();
      });
    });

    it('should map terminationDate to termDate in request', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { terminationDate: '2026-12-31' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.termDate).toBe('2026-12-31');
        done();
      });
    });

    it('should include terminationPeriod in request when provided', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = { terminationPeriod: 'Before' };
      service.getDefinePhysicalFindingsValues(25, 0, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.terminationPeriod).toBe('Before');
        done();
      });
    });

    it('should include all filter params together in request', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      const params: DefinePhysicalFindingsValuesParamsDto = {
        sort: 'D',
        operator: 'EQUALS',
        interdiction: '00009',
        manualAuditFindingsFlag: 'Y',
        equipmentType: '500',
        effectiveDate: '2026-01-01',
        effectivePeriod: 'After',
        terminationDate: '2026-12-31',
        terminationPeriod: 'Before'
      };
      service.getDefinePhysicalFindingsValues(10, 5, params).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.sortOrder).toBe('DESC');
        expect(callArgs.itemOperator).toBe('EQUALS');
        expect(callArgs.interCode).toBe('00009');
        expect(callArgs.manualAuditFlag).toBe('Y');
        expect(callArgs.equipType).toBe('500');
        expect(callArgs.effDate).toBe('2026-01-01');
        expect(callArgs.effectivePeriod).toBe('After');
        expect(callArgs.termDate).toBe('2026-12-31');
        expect(callArgs.terminationPeriod).toBe('Before');
        done();
      });
    });

    it('should use response.Data (capital D) when response.data is absent', (done) => {
      const altResponse = {
        Data: [
          {
            physicalCode: 'BP',
            physicalCodeDescription: 'Blood Pressure',
            dataType: 'N',
            itemValue: '80',
            itemValueMax: '120',
            itemOperator: 'BETWEEN',
            gender: 'A',
            fromAge: 18,
            toAge: 65,
            interCode: '00010',
            interdictionDescription: 'BP Interdiction',
            equipType: '500',
            equipmentTypeDescription: 'Equipment 500',
            commentReqFlag: null,
            manualAuditFlag: null,
            effDate: '2026-01-01',
            termDate: null,
            donationType: 'WB',
            donationTypeDescription: 'Whole Blood',
            procedureCode: 'WB',
            procedureCodeDescription: 'Whole Blood'
          }
        ],
        Total: 1
      };
      mockApiService.post.and.returnValue(of(altResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].physicalCode).toBe('BP');
        expect(response.totalRecords).toBe(1);
        done();
      });
    });

    it('should use response.total when response.totalCount is absent', (done) => {
      const altResponse = { data: mockResponse.data, total: 42 };
      mockApiService.post.and.returnValue(of(altResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.totalRecords).toBe(42);
        done();
      });
    });

    it('should use response.Total when both totalCount and total are absent', (done) => {
      const altResponse = { data: mockResponse.data, Total: 99 };
      mockApiService.post.and.returnValue(of(altResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.totalRecords).toBe(99);
        done();
      });
    });

    it('should default totalRecords to 0 when no count property exists', (done) => {
      const altResponse = { data: mockResponse.data };
      mockApiService.post.and.returnValue(of(altResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty data when response has no data or Data', (done) => {
      mockApiService.post.and.returnValue(of({ totalCount: 0 }));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.data.length).toBe(0);
        expect(response.totalRecords).toBe(0);
        done();
      });
    });

    it('should default commentsRequired to N when commentReqFlag is falsy', (done) => {
      const responseWithNulls = {
        data: [{ ...mockResponse.data[0], commentReqFlag: null }],
        totalCount: 1
      };
      mockApiService.post.and.returnValue(of(responseWithNulls));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.data[0].commentsRequired).toBe('N');
        done();
      });
    });

    it('should default manualAuditRequired to N when manualAuditFlag is falsy', (done) => {
      const responseWithNulls = {
        data: [{ ...mockResponse.data[0], manualAuditFlag: '' }],
        totalCount: 1
      };
      mockApiService.post.and.returnValue(of(responseWithNulls));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        expect(response.data[0].manualAuditRequired).toBe('N');
        done();
      });
    });

    it('should propagate error from API on getDefinePhysicalFindingsValues', (done) => {
      const apiError = { status: 500, message: 'Internal Server Error' };
      mockApiService.post.and.returnValue(throwError(() => apiError));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        }
      });
    });

    it('should use default empty params when none provided', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.chapterId).toBe('TST');
        expect(callArgs.take).toBe(25);
        expect(callArgs.skip).toBe(0);
        expect(callArgs.searchKeyword).toBeUndefined();
        expect(callArgs.donationType).toBeUndefined();
        expect(callArgs.procedureCode).toBeUndefined();
        done();
      });
    });
  });

  describe('getLookups', () => {
    it('should fetch lookups data', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockLookups] }));

      service.getLookups().subscribe((lookups) => {
        expect(lookups.donationTypes.length).toBe(2);
        expect(lookups.procedureCodes.length).toBe(2);
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should handle empty lookups', (done) => {
      const emptyLookups = {
        donationTypes: [],
        procedureCodes: [],
        physicalCodes: [],
        interdictionCodes: [],
        equipmentTypes: []
      };
      mockApiService.get.and.returnValue(of({ data: [emptyLookups] }));

      service.getLookups().subscribe((lookups) => {
        expect(lookups.donationTypes.length).toBe(0);
        done();
      });
    });

    it('should use response.Data (capital D) when response.data is absent', (done) => {
      mockApiService.get.and.returnValue(of({ Data: [mockLookups] }));

      service.getLookups().subscribe((lookups) => {
        expect(lookups.donationTypes.length).toBe(2);
        expect(lookups.procedureCodes.length).toBe(2);
        done();
      });
    });

    it('should use response directly when neither data nor Data exists', (done) => {
      mockApiService.get.and.returnValue(of(mockLookups));

      service.getLookups().subscribe((lookups) => {
        expect(lookups.donationTypes.length).toBe(2);
        done();
      });
    });

    it('should handle non-array rawData (object directly)', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockLookups }));

      service.getLookups().subscribe((lookups) => {
        expect(lookups.donationTypes.length).toBe(2);
        done();
      });
    });

    it('should build endpoint with encoded chapterId', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockLookups] }));

      service.getLookups().subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args[0];
        expect(callArgs).toContain('chapterId=TST');
        expect(callArgs).toContain('/lookups?');
        done();
      });
    });

    it('should propagate error from API on getLookups', (done) => {
      const apiError = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => apiError));

      service.getLookups().subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        }
      });
    });
  });

  describe('createPhysicalRule', () => {
    const baseRule: PhysicalRuleFormData = {
      donationType: 'UAT2',
      procedureCode: 'm9',
      physicalCode: 'AGE',
      dataType: 'N',
      minimumValue: '11',
      maximumValue: '112',
      operator: 'BETWEEN',
      gender: 'A',
      fromAge: 11,
      toAge: 111,
      interdiction: '00008',
      commentsRequired: 'Y',
      manualAuditRequired: 'Y',
      equipmentType: '1000',
      effectiveDate: new Date('2026-04-02'),
      terminationDate: null
    };

    it('should create a new physical rule', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule(baseRule).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(mockApiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should map commentsRequired Y to commentReqFlag Y', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, commentsRequired: 'Y' }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.commentReqFlag).toBe('Y');
        done();
      });
    });

    it('should map commentsRequired non-Y to commentReqFlag null', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, commentsRequired: 'N' }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.commentReqFlag).toBeNull();
        done();
      });
    });

    it('should map manualAuditRequired Y to manualAuditFlag Y', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, manualAuditRequired: 'Y' }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBe('Y');
        done();
      });
    });

    it('should map manualAuditRequired non-Y to manualAuditFlag null', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, manualAuditRequired: 'N' }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBeNull();
        done();
      });
    });

    it('should default success to true when response.success is undefined', (done) => {
      mockApiService.post.and.returnValue(of({ message: 'Created' }));

      service.createPhysicalRule(baseRule).subscribe((response) => {
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should default message when response.message is undefined', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      service.createPhysicalRule(baseRule).subscribe((response) => {
        expect(response.message).toBe('Physical Rule added successfully');
        done();
      });
    });

    it('should use response message when provided', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Custom message' }));

      service.createPhysicalRule(baseRule).subscribe((response) => {
        expect(response.message).toBe('Custom message');
        done();
      });
    });

    it('should send chapterId ALL and programId PHYRULE in request', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.chapterId).toBe('ALL');
        expect(callArgs.programId).toBe('PHYRULE');
        done();
      });
    });

    it('should convert effectiveDate to local date string format', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, effectiveDate: new Date('2026-04-02') }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.effDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
        done();
      });
    });

    it('should send null for termDate when terminationDate is null', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, terminationDate: null }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.termDate).toBeNull();
        done();
      });
    });

    it('should convert string date for effectiveDate via toLocalDateString', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, effectiveDate: '2026-06-15' as any }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.effDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
        done();
      });
    });

    it('should convert terminationDate Date object via toLocalDateString', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule({ ...baseRule, terminationDate: new Date('2026-12-31') }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.termDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
        done();
      });
    });

    it('should handle object with toDate method (moment-like) for dates', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));
      const momentLike = { toDate: () => new Date('2026-07-15') };

      service.createPhysicalRule({ ...baseRule, effectiveDate: momentLike as any }).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.effDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
        done();
      });
    });

    it('should propagate error from API on createPhysicalRule', (done) => {
      const apiError = { status: 400, message: 'Bad Request' };
      mockApiService.post.and.returnValue(throwError(() => apiError));

      service.createPhysicalRule(baseRule).subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        }
      });
    });

    it('should map all form fields to correct API field names', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.createPhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.donationType).toBe('UAT2');
        expect(callArgs.procedureCode).toBe('m9');
        expect(callArgs.physicalCode).toBe('AGE');
        expect(callArgs.dataType).toBe('N');
        expect(callArgs.itemValue).toBe('11');
        expect(callArgs.itemValueMax).toBe('112');
        expect(callArgs.itemOperator).toBe('BETWEEN');
        expect(callArgs.gender).toBe('A');
        expect(callArgs.fromAge).toBe(11);
        expect(callArgs.toAge).toBe(111);
        expect(callArgs.interCode).toBe('00008');
        expect(callArgs.equipType).toBe('1000');
        done();
      });
    });
  });

  describe('updatePhysicalRule', () => {
    const baseRule: PhysicalRuleFormData = {
      donationType: 'UAT2',
      procedureCode: 'm9',
      physicalCode: 'AGE',
      dataType: 'N',
      minimumValue: '15',
      maximumValue: '120',
      operator: 'BETWEEN',
      gender: 'A',
      fromAge: 15,
      toAge: 120,
      interdiction: '00008',
      commentsRequired: 'Y',
      manualAuditRequired: 'Y',
      equipmentType: '1000',
      effectiveDate: new Date('2026-04-02'),
      terminationDate: null
    };

    it('should update an existing physical rule', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(mockApiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should include newProcedureCode and newPhysicalCode when provided', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      const ruleWithNew = { ...baseRule, newProcedureCode: 'WB', newPhysicalCode: 'BP' };
      service.updatePhysicalRule(ruleWithNew).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.newProcedureCode).toBe('WB');
        expect(callArgs.newPhysicalCode).toBe('BP');
        done();
      });
    });

    it('should set newProcedureCode and newPhysicalCode to null when not provided', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.newProcedureCode).toBeNull();
        expect(callArgs.newPhysicalCode).toBeNull();
        done();
      });
    });

    it('should set fromAge to null when fromAge is falsy (0)', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, fromAge: 0 }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.fromAge).toBeNull();
        done();
      });
    });

    it('should set toAge to null when toAge is falsy (0)', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, toAge: 0 }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.toAge).toBeNull();
        done();
      });
    });

    it('should map commentsRequired non-Y to commentReqFlag null', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, commentsRequired: 'N' }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.commentReqFlag).toBeNull();
        done();
      });
    });

    it('should map manualAuditRequired non-Y to manualAuditFlag null', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, manualAuditRequired: 'N' }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBeNull();
        done();
      });
    });

    it('should map commentsRequired Y to commentReqFlag Y', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, commentsRequired: 'Y' }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.commentReqFlag).toBe('Y');
        done();
      });
    });

    it('should map manualAuditRequired Y to manualAuditFlag Y', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, manualAuditRequired: 'Y' }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.manualAuditFlag).toBe('Y');
        done();
      });
    });

    it('should default success to true when response.success is undefined', (done) => {
      mockApiService.put.and.returnValue(of({ message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe((response) => {
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should default message when response.message is undefined', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updatePhysicalRule(baseRule).subscribe((response) => {
        expect(response.message).toBe('Physical Rule updated successfully');
        done();
      });
    });

    it('should use response message when provided', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Custom update message' }));

      service.updatePhysicalRule(baseRule).subscribe((response) => {
        expect(response.message).toBe('Custom update message');
        done();
      });
    });

    it('should send chapterId ALL and programId PHYRULE in request', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.chapterId).toBe('ALL');
        expect(callArgs.programId).toBe('PHYRULE');
        done();
      });
    });

    it('should convert effectiveDate to local date string format', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.effDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
        done();
      });
    });

    it('should send null for termDate when terminationDate is null', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule({ ...baseRule, terminationDate: null }).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.termDate).toBeNull();
        done();
      });
    });

    it('should propagate error from API on updatePhysicalRule', (done) => {
      const apiError = { status: 400, message: 'Validation Error' };
      mockApiService.put.and.returnValue(throwError(() => apiError));

      service.updatePhysicalRule(baseRule).subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        }
      });
    });

    it('should preserve success false when explicitly returned', (done) => {
      mockApiService.put.and.returnValue(of({ success: false, message: 'Duplicate record' }));

      service.updatePhysicalRule(baseRule).subscribe((response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Duplicate record');
        done();
      });
    });

    it('should map all form fields to correct API field names', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updatePhysicalRule(baseRule).subscribe(() => {
        const callArgs = mockApiService.put.calls.mostRecent().args[1];
        expect(callArgs.donationType).toBe('UAT2');
        expect(callArgs.procedureCode).toBe('m9');
        expect(callArgs.physicalCode).toBe('AGE');
        expect(callArgs.dataType).toBe('N');
        expect(callArgs.itemValue).toBe('15');
        expect(callArgs.itemValueMax).toBe('120');
        expect(callArgs.itemOperator).toBe('BETWEEN');
        expect(callArgs.gender).toBe('A');
        expect(callArgs.interCode).toBe('00008');
        expect(callArgs.equipType).toBe('1000');
        done();
      });
    });
  });

  describe('Field Mapping', () => {
    it('should map API response fields to model fields correctly', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefinePhysicalFindingsValues(25, 0, {}).subscribe((response) => {
        const item = response.data[0];
        expect(item.minimumValue).toBe('11'); // itemValue -> minimumValue
        expect(item.maximumValue).toBe('112'); // itemValueMax -> maximumValue
        expect(item.operator).toBe('BETWEEN'); // itemOperator -> operator
        expect(item.interdiction).toBe('00008'); // interCode -> interdiction
        expect(item.equipmentType).toBe('1000'); // equipType -> equipmentType
        expect(item.commentsRequired).toBe('Y'); // commentReqFlag -> commentsRequired
        expect(item.manualAuditRequired).toBe('Y'); // manualAuditFlag -> manualAuditRequired
        done();
      });
    });

    it('should map request fields to API fields correctly', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      const newRule: PhysicalRuleFormData = {
        donationType: 'UAT2',
        procedureCode: 'm9',
        physicalCode: 'AGE',
        dataType: 'N',
        minimumValue: '11',
        maximumValue: '112',
        operator: 'BETWEEN',
        gender: 'A',
        fromAge: 11,
        toAge: 111,
        interdiction: '00008',
        commentsRequired: 'Y',
        manualAuditRequired: 'Y',
        equipmentType: '1000',
        effectiveDate: new Date('2026-04-02'),
        terminationDate: null
      };

      service.createPhysicalRule(newRule).subscribe(() => {
        const callArgs = mockApiService.post.calls.mostRecent().args[1];
        expect(callArgs.itemValue).toBe('11'); // minimumValue -> itemValue
        expect(callArgs.itemValueMax).toBe('112'); // maximumValue -> itemValueMax
        expect(callArgs.itemOperator).toBe('BETWEEN'); // operator -> itemOperator
        expect(callArgs.interCode).toBe('00008'); // interdiction -> interCode
        expect(callArgs.equipType).toBe('1000'); // equipmentType -> equipType
        expect(callArgs.commentReqFlag).toBe('Y'); // commentsRequired -> commentReqFlag
        expect(callArgs.manualAuditFlag).toBe('Y'); // manualAuditRequired -> manualAuditFlag
        done();
      });
    });

    it('should map all response item fields including dates and descriptions', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefinePhysicalFindingsValues(25, 0).subscribe((response) => {
        const item = response.data[0];
        expect(item.physicalCode).toBe('AGE');
        expect(item.physicalCodeDescription).toBe('Donor age not acceptable');
        expect(item.dataType).toBe('N');
        expect(item.gender).toBe('A');
        expect(item.fromAge).toBe(11);
        expect(item.toAge).toBe(111);
        expect(item.interdictionDescription).toBe('Test Interdiction 1');
        expect(item.equipmentTypeDescription).toBe('Equipment Type 1000');
        expect(item.effectiveDate).toBe('2026-04-02T13:00:00');
        expect(item.terminationDate).toBe('2026-04-29T13:00:00');
        expect(item.donationType).toBe('UAT2');
        expect(item.donationTypeDescription).toBe('LOCAL TIME TESTING UAT 2');
        expect(item.procedureCode).toBe('m9');
        expect(item.procedureCodeDescription).toBe('test m9');
        done();
      });
    });
  });
});
