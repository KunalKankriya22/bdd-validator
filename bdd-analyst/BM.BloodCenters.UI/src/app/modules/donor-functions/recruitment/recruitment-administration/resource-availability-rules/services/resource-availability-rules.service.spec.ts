import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ResourceAvailabilityRulesService } from './resource-availability-rules.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ResourceAvailabilityRuleModel,
  ValidResourceModel,
  CreateResourceAvailabilityRuleDto,
  UpdateResourceAvailabilityRuleDto
} from '../models/resource-availability-rules.model';

describe('ResourceAvailabilityRulesService', () => {
  let service: ResourceAvailabilityRulesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourceAvailabilityRulesService]
    });

    service = TestBed.inject(ResourceAvailabilityRulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getResourceAvailabilityRules', () => {
    it('should fetch resource availability rules', () => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [
          { weekDay: 'MON', maxAvailable: 10, effDate: '2026-01-01', termDate: null }
        ],
        total: 1
      };

      service.getResourceAvailabilityRules({
        chapterId: 'TEST',
        resourceCode: 'RES01',
        showTerminated: 'NO'
      }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0].weekDay).toBe('MON');
      });

      const req = httpMock.expectOne(API.RESOURCE_AVAILABILITY.DETAILS);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getValidResources', () => {
    it('should fetch valid resources', () => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [
          { resourceCode: 'RES01', resourceDesc: 'Resource 1', isTerminated: false },
          { resourceCode: 'RES02', resourceDesc: 'Resource 2', isTerminated: true }
        ],
        total: 2
      };

      service.getValidResources().subscribe(resources => {
        expect(resources.length).toBe(2);
        expect(resources[0].resourceCode).toBe('RES01');
        expect(resources[1].isTerminated).toBe(true);
      });

      const req = httpMock.expectOne(API.RESOURCE_AVAILABILITY.VALID_RESOURCES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getResourceAvailabilitySummary', () => {
    it('should fetch resource availability summary', () => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [
          {
            resourceCode: 'RES01',
            chapterId: 'TEST',
            monday: 10,
            tuesday: 15,
            wednesday: null,
            thursday: 20,
            friday: 25,
            saturday: null,
            sunday: null
          }
        ],
        total: 1
      };

      service.getResourceAvailabilitySummary('TEST').subscribe(summary => {
        expect(summary.length).toBe(1);
        expect(summary[0].monday).toBe(10);
        expect(summary[0].tuesday).toBe(15);
      });

      const req = httpMock.expectOne(`${API.RESOURCE_AVAILABILITY.ACTIVE_RESOURCES_SUMMARY}?chapterId=TEST`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createResourceAvailabilityRule', () => {
    it('should create a new resource availability rule', () => {
      const createDto: CreateResourceAvailabilityRuleDto = {
        chapterId: 'TEST',
        loggedInUserName: 'testuser',
        resourceCode: 'RES01',
        weekDay: 'MON',
        maxAvailable: 10,
        effectiveDate: '2026-01-01T00:00:00.000Z',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Rule created successfully',
        error: null,
        statusCode: 201,
        data: [createDto],
        total: 1
      };

      service.createResourceAvailabilityRule(createDto).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Rule created successfully');
      });

      const req = httpMock.expectOne(API.RESOURCE_AVAILABILITY.INSERT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('updateResourceAvailabilityRule', () => {
    it('should update an existing resource availability rule', () => {
      const updateDto: UpdateResourceAvailabilityRuleDto = {
        chapterId: 'TEST',
        loggedInUserName: 'testuser',
        resourceCode: 'RES01',
        weekDay: 'MON',
        maxAvailable: 15,
        effectiveDate: '2026-01-01T00:00:00.000Z',
        terminationDate: '2026-12-31T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: 'Rule updated successfully',
        error: null,
        statusCode: 200,
        data: [updateDto],
        total: 1
      };

      service.updateResourceAvailabilityRule(updateDto).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Rule updated successfully');
      });

      const req = httpMock.expectOne(API.RESOURCE_AVAILABILITY.UPDATE);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('getWeekDays', () => {
    it('should return array of week days', () => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        total: 7
      };

      service.getWeekDays().subscribe(weekDays => {
        expect(weekDays.length).toBe(7);
        expect(weekDays).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
      });

      const req = httpMock.expectOne(API.RESOURCE_AVAILABILITY.WEEK_DAYS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
