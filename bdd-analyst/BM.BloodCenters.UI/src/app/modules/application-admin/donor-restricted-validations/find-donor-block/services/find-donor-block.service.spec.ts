import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FindDonorBlockService } from './find-donor-block.service';
import { HeaderService } from '@shared/services/header.service';
import { ApiService } from '@shared/services/api.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  FindDonorBlockModel,
  ProgramRuleApiResponse,
  AddProgramRuleDto,
  UpdateProgramRuleDto,
  FieldConfigurationDto
} from '../models/find-donor-block.model';

describe('FindDonorBlockService', () => {
  let service: FindDonorBlockService;
  let httpMock: HttpTestingController;
  let headerService: jasmine.SpyObj<HeaderService>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockChapterId = 'TEST123';
  const baseUrl = '/api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program';

  beforeEach(() => {
    const headerServiceSpy = createMockHeaderService({ chapterId: signal('TEST123') });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FindDonorBlockService,
        { provide: HeaderService, useValue: headerServiceSpy },
        ApiService
      ]
    });

    service = TestBed.inject(FindDonorBlockService);
    httpMock = TestBed.inject(HttpTestingController);
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    httpMock.verify();
  });


  describe('getProgramRules', () => {
    it('should fetch and map program rules successfully', (done) => {
      const mockApiResponse: ProgramRuleApiResponse[] = [
        {
          programId: 'TEST',
          programName: 'DON_VERIFY',
          allowCreate: 'Y',
          gradingLevel: '0',
          allowNew: 'Y',
          allowSelect: 'O',
          allowHold: 'N',
          flag1: 'Y',
          flag2: 'N',
          flag3: 'N',
          flag4: 'N',
          selectAllowedLevels: '0',
          newAllowedLevel: '0',
          selectAllowedMultilevel: '0',
          enforcePassword: 'Y',
          multipleSelection: 'N',
          updateKeyInfo: 'N'
        }
      ];

      service.getProgramRules().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].programName).toBe('DON_VERIFY');
          expect(result[0].createNewDonor).toBe(true);
          expect(result[0].newAllowed).toBe(true);
          expect(result[0].selectAllowed).toBe('Optional');
          expect(result[0].holdAllowed).toBe(false);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne((request) => request.url === baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Chapter-Id')).toBe(mockChapterId);
      req.flush(mockApiResponse);
    });

    it('should return empty array when response is not an array', (done) => {
      service.getProgramRules().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne((request) => request.url === baseUrl);
      req.flush({});
    });


  });

  describe('addProgramRule', () => {
    it('should add program rule successfully', (done) => {
      const mockDto: AddProgramRuleDto = {
        programName: 'NEW_PROGRAM',
        allowCreate: 'Y',
        multipleSelection: 'N',
        gradingLevel: '0',
        updateKeyInfo: 'N',
        allowNew: 'Y',
        allowSelect: 'Y',
        allowHold: 'N',
        flag1: 'N',
        flag2: 'N',
        flag3: 'N',
        flag4: 'N',
        selectAllowedLevels: '0',
        newAllowedLevel: '0',
        selectAllowedMultilevel: '0',
        enforcePassword: 'Y'
      };

      const mockResponse = { message: 'Program created successfully.' };

      service.addProgramRule(mockDto).subscribe({
        next: (result) => {
          expect(result.message).toBe('Program created successfully.');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockResponse);
    });
  });

  describe('updateProgramRule', () => {
    it('should update program rule successfully', (done) => {
      const programName = 'DON_VERIFY';
      const mockDto: UpdateProgramRuleDto = {
        allowCreate: 'Y',
        multipleSelection: 'N',
        gradingLevel: '0',
        updateKeyInfo: 'N',
        allowNew: 'Y',
        allowSelect: 'O',
        allowHold: 'N',
        flag1: 'Y',
        flag2: 'N',
        flag3: 'N',
        flag4: 'N',
        selectAllowedLevels: '0',
        newAllowedLevel: '0',
        selectAllowedMultilevel: '0',
        enforcePassword: 'Y'
      };

      const mockResponse = { message: 'Program updated successfully.' };

      service.updateProgramRule(programName, mockDto).subscribe({
        next: (result) => {
          expect(result.message).toBe('Program updated successfully.');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(programName)}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockResponse);
    });
  });

  describe('getFieldConfigurations', () => {
    it('should fetch and map field configurations successfully', (done) => {
      const programName = 'DON_VERIFY';
      const mockApiResponse = [
        {
          programId: 'TEST',
          programName: 'DON_VERIFY',
          fieldName: 'FIRST_NAME',
          required: 'Y',
          noOfEntries: 1,
          functionCheck: 'Y',
          protectedEntry: 'N',
          effDate: '2024-01-01T00:00:00'
        }
      ];

      service.getFieldConfigurations(programName).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].fieldName).toBe('FIRST_NAME');
          expect(result[0].required).toBe(true);
          expect(result[0].numberOfEntries).toBe(1);
          expect(result[0].functionCheck).toBe(true);
          expect(result[0].protectedEntry).toBe(false);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(programName)}/fields`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });
  });

  describe('addFieldConfiguration', () => {
    it('should add field configuration successfully', (done) => {
      const programName = 'DON_VERIFY';
      const mockDto: FieldConfigurationDto = {
        fieldName: 'GENDER',
        required: 'Y',
        noOfEntries: 1,
        functionCheck: 'N',
        protectedEntry: 'N'
      };

      const mockResponse = { message: 'Field created successfully.' };

      service.addFieldConfiguration(programName, mockDto).subscribe({
        next: (result) => {
          expect(result.message).toBe('Field created successfully.');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(programName)}/fields`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockResponse);
    });
  });

  describe('Mapping methods', () => {
    it('should map form data to add DTO correctly', () => {
      const formData = {
        programName: 'TEST_PROGRAM',
        createNewDonor: true,
        gradeLevel: '2',
        newAllowed: 'Optional',
        selectAllowed: true,
        holdAllowed: false,
        flag1: true,
        flag2: false,
        flag3: false,
        flag4: false,
        selectAllowedGrade: '1',
        newAllowedGrade: '2',
        selectMultipleGrade: '3'
      };

      const result = service.mapFormDataToAddDto(formData);

      expect(result.programName).toBe('TEST_PROGRAM');
      expect(result.allowCreate).toBe('Y');
      expect(result.gradingLevel).toBe('2');
      expect(result.allowNew).toBe('O');
      expect(result.allowSelect).toBe('Y');
      expect(result.allowHold).toBe('N');
      expect(result.flag1).toBe('Y');
      expect(result.flag2).toBe('N');
      expect(result.selectAllowedLevels).toBe('1');
    });

    it('should map form data to update DTO correctly', () => {
      const formData = {
        programName: 'TEST_PROGRAM',
        createNewDonor: false,
        gradeLevel: '3',
        newAllowed: false,
        selectAllowed: 'Optional',
        holdAllowed: true,
        flag1: false,
        flag2: true,
        flag3: false,
        flag4: false,
        selectAllowedGrade: '2',
        newAllowedGrade: '1',
        selectMultipleGrade: '4',
        multipleSelection: 'Y',
        updateKeyInfo: 'N',
        enforcePassword: 'Y'
      };

      const result = service.mapFormDataToUpdateDto(formData);

      expect(result.programName).toBe('TEST_PROGRAM');
      expect(result.allowCreate).toBe('N');
      expect(result.gradingLevel).toBe('3');
      expect(result.allowNew).toBe('N');
      expect(result.allowSelect).toBe('O');
      expect(result.allowHold).toBe('Y');
      expect(result.flag2).toBe('Y');
      expect(result.multipleSelection).toBe('Y');
    });

    it('should map field config to DTO correctly', () => {
      const fieldData = {
        fieldName: 'TEST_FIELD',
        required: true,
        numberOfEntries: 2,
        functionCheck: false,
        protectedEntry: true
      };

      const result = service.mapFieldConfigToDto(fieldData);

      expect(result.fieldName).toBe('TEST_FIELD');
      expect(result.required).toBe('Y');
      expect(result.noOfEntries).toBe(2);
      expect(result.functionCheck).toBe('N');
      expect(result.protectedEntry).toBe('Y');
    });
  });

  describe('getDropdownValues', () => {
    it('should extract unique program names and grade levels', (done) => {
      const mockApiResponse: ProgramRuleApiResponse[] = [
        {
          programId: 'TEST1',
          programName: 'PROGRAM_A',
          allowCreate: 'Y',
          gradingLevel: '2',
          selectAllowedLevels: '0',
          newAllowedLevel: '0',
          selectAllowedMultilevel: '0',
          enforcePassword: 'Y'
        },
        {
          programId: 'TEST2',
          programName: 'PROGRAM_B',
          allowCreate: 'Y',
          gradingLevel: '3',
          selectAllowedLevels: '0',
          newAllowedLevel: '0',
          selectAllowedMultilevel: '0',
          enforcePassword: 'N'
        },
        {
          programId: 'TEST3',
          programName: 'PROGRAM_A',
          allowCreate: 'N',
          gradingLevel: '2',
          selectAllowedLevels: '0',
          newAllowedLevel: '0',
          selectAllowedMultilevel: '0',
          enforcePassword: 'Y'
        }
      ];

      service.getDropdownValues().subscribe({
        next: (result) => {
          expect(result.programNames).toEqual(['PROGRAM_A', 'PROGRAM_B']);
          expect(result.gradeLevels).toContain('2');
          expect(result.gradeLevels).toContain('3');
          done();
        },
        error: done.fail
      });

      const rulesReq = httpMock.expectOne((request) => request.url === baseUrl);
      rulesReq.flush(mockApiResponse);

      const gradeLevelsReq = httpMock.expectOne((request) => request.url === `${baseUrl}/grade-levels`);
      gradeLevelsReq.flush([{ grade: 2 }, { grade: 3 }]);
    });

    it('should use default grade levels when no data available', (done) => {
      const mockApiResponse: ProgramRuleApiResponse[] = [
        {
          programId: 'TEST1',
          programName: 'PROGRAM_A',
          allowCreate: 'Y',
          gradingLevel: '',
          selectAllowedLevels: '0',
          newAllowedLevel: '0',
          selectAllowedMultilevel: '0',
          enforcePassword: 'Y'
        }
      ];

      service.getDropdownValues().subscribe({
        next: (result) => {
          expect(result.gradeLevels).toEqual(['0', '1', '2', '3', '4']);
          done();
        },
        error: done.fail
      });

      const rulesReq = httpMock.expectOne((request) => request.url === baseUrl);
      rulesReq.flush(mockApiResponse);

      const gradeLevelsReq = httpMock.expectOne((request) => request.url === `${baseUrl}/grade-levels`);
      gradeLevelsReq.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
