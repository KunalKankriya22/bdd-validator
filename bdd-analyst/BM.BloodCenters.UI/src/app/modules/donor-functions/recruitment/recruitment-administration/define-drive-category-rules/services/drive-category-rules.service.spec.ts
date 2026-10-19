import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DriveCategoryRulesService } from './drive-category-rules.service';
import {
  CreateDriveCategoryRuleRequestDto,
  UpdateDriveCategoryRuleRequestDto,
  ApiResponse
} from '../models/drive-category-rules.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DriveCategoryRulesService', () => {
  let service: DriveCategoryRulesService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockRule = {
    ruleId: 'RULE001',
    driveCategory: 'MOBILE',
    description: 'Mobile Blood Drive',
    numberAllowed: 5,
    maxSize: 100,
    effDate: '2025-01-01',
    termDate: '2025-12-31',
    modificationDate: '2025-03-01',
    lastModifiedBy: 'admin',
    lastModifiedDate: '2025-03-01'
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    mockHeaderService = createMockHeaderService({ chapterId: signal('DAL') });
    TestBed.configureTestingModule({
      providers: [
        DriveCategoryRulesService,
        { provide: ApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    service = TestBed.inject(DriveCategoryRulesService);
  });

  describe('getDriveCategoryRules', () => {
    it('should fetch drive category rules with pagination', () => {
      const apiResponse = { data: [mockRule], total: 1 };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getDriveCategoryRules(25, 0, { searchTerm: 'test' }).subscribe(response => {
        expect(response.data).toEqual([mockRule]);
        expect(response.totalRecords).toBe(1);
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/drive-category-rules/25/0',
        jasmine.objectContaining({ searchTerm: 'test', chapterId: 'DAL' })
      );
    });
  });

  describe('getDriveCategoryRule', () => {
    it('should fetch a single rule by ID and category', () => {
      const apiResponse = { data: [mockRule] };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getDriveCategoryRule('RULE001', 'MOBILE').subscribe(rule => {
        expect(rule).toEqual(mockRule);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/drive-category-rules/RULE001/MOBILE');
    });
  });

  describe('createDriveCategoryRule', () => {
    it('should create a new rule', () => {
      const createDto: CreateDriveCategoryRuleRequestDto = {
        ruleId: 'RULE001',
        driveCategory: 'MOBILE',
        numberAllowed: 5,
        maxSize: 100,
        effDate: '2025-01-01',
        termDate: '2025-12-31'
      };

      const createResponse = { success: true, message: 'Rule created successfully' };
      mockApiService.post.and.returnValue(of(createResponse));

      service.createDriveCategoryRule(createDto).subscribe(response => {
        expect(response.success).toBe(true);
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/drive-category-rules',
        jasmine.objectContaining({ driveCategory: 'MOBILE', chapterId: 'DAL' })
      );
    });
  });

  describe('updateDriveCategoryRule', () => {
    it('should update an existing rule', () => {
      const updateDto: UpdateDriveCategoryRuleRequestDto = {
        driveCategory: 'MOBILE',
        numberAllowed: 10,
        maxSize: 150,
        effDate: '2025-01-01',
        termDate: '2025-12-31'
      };

      const updateResponse = { success: true, message: 'Rule updated successfully' };
      mockApiService.put.and.returnValue(of(updateResponse));

      service.updateDriveCategoryRule('RULE001', 'MOBILE', updateDto).subscribe(response => {
        expect(response.success).toBe(true);
      });

      expect(mockApiService.put).toHaveBeenCalledWith(
        '/api/v1/drive-category-rules/RULE001/MOBILE',
        jasmine.objectContaining({ numberAllowed: 10, chapterId: 'DAL' })
      );
    });
  });

  describe('getNextRuleId', () => {
    it('should fetch next available rule ID', () => {
      mockApiService.get.and.returnValue(of({ ruleId: 'RULE002' }));

      service.getNextRuleId().subscribe(ruleId => {
        expect(ruleId).toBe('RULE002');
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/drive-category-rules/generate-rule-id');
    });
  });

  describe('getCategories', () => {
    it('should fetch category options', () => {
      const categories = [
        { code: 'MOBILE', description: 'Mobile Blood Drive' },
        { code: 'FIXED', description: 'Fixed Site' }
      ];
      mockApiService.get.and.returnValue(of({ data: categories }));

      service.getCategories().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MOBILE');
      });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/drive-category-rules/categories');
    });
  });
});
