import { TestBed } from '@angular/core/testing';
import { HHResponseGroupsService } from './hh-response-groups.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('HHResponseGroupsService', () => {
  let service: HHResponseGroupsService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    mockHeaderService = createMockHeaderService();
    TestBed.configureTestingModule({
      providers: [
        HHResponseGroupsService,
        { provide: ApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    service = TestBed.inject(HHResponseGroupsService);
  });


  it('should get response groups with mock data', (done) => {
    mockApiService.post.and.returnValue(of({
      data: [
        { groupCode: 'MIGRAINE', description: 'Migraine Group', questionCode: 'HQ0020', responseCode: 'Yes', effectiveDate: '2026-04-01', chapterId: 'CH001' }
      ],
      total: 1
    }));

    service.getResponseGroups(10, 0, {}).subscribe(result => {
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.totalRecords).toBeGreaterThan(0);
      done();
    });
  });

  it('should filter by question code', (done) => {
    mockApiService.post.and.returnValue(of({
      data: [
        { groupCode: 'MIGRAINE', description: 'Migraine Group', questionCode: 'HQ0020', responseCode: 'Yes', effectiveDate: '2026-04-01', chapterId: 'CH001' }
      ],
      total: 1
    }));

    service.getResponseGroups(10, 0, { questionCode: 'HQ0020' }).subscribe(result => {
      expect(result.data.every(g => g.questionCode === 'HQ0020')).toBe(true);
      done();
    });
  });

  it('should search by keyword', (done) => {
    mockApiService.post.and.returnValue(of({
      data: [
        { groupCode: 'MIGRAINE', description: 'Migraine Group', questionCode: 'HQ0020', responseCode: 'Yes', effectiveDate: '2026-04-01', chapterId: 'CH001' }
      ],
      total: 1
    }));

    service.getResponseGroups(10, 0, { searchKeyword: 'MIGRAINE' }).subscribe(result => {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].groupCode).toBe('MIGRAINE');
      done();
    });
  });

  it('should get filter dropdowns', (done) => {
    mockApiService.get.and.returnValue(of({
      data: [{
        questionCodes: [{ code: 'HQ0020', description: 'Test Question' }],
        responseCodes: [{ code: 'Y', description: 'Yes' }]
      }]
    }));

    service.getFilterDropdowns().subscribe(result => {
      expect(result.questionCodes).toBeDefined();
      expect(result.responseCodes).toBeDefined();
      expect(result.questionCodes!.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should get questions list', (done) => {
    mockApiService.get.and.returnValue(of({
      data: [[
        { questionCode: 'HQ0020', questionText: 'Are you feeling well?' }
      ]]
    }));

    service.getQuestionsList().subscribe(result => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should add new response group', (done) => {
    mockApiService.post.and.returnValue(of({
      success: true,
      message: 'Response group added successfully'
    }));

    const newGroup = {
      groupCode: 'TEST',
      description: 'Test Group',
      questionCode: 'HQ0020',
      responseCode: 'Yes',
      effectiveDate: '2026-04-01',
      chapterId: 'CH001'
    };

    service.addResponseGroup(newGroup).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.message).toContain('added successfully');
      done();
    });
  });

  it('should update existing response group', (done) => {
    mockApiService.put.and.returnValue(of({
      success: true,
      message: 'Response group updated successfully'
    }));

    const updateData = {
      groupCode: 'MIGRAINE',
      description: 'Updated Description',
      questionCode: 'HQ0020',
      responseCode: 'No',
      effectiveDate: '2026-04-01',
      chapterId: 'CH001'
    };

    service.updateResponseGroup(updateData).subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
      done();
    });
  });

  it('should delete response group', (done) => {
    mockApiService.delete.and.returnValue(of({
      success: true,
      message: 'Response group deleted successfully'
    }));

    service.deleteResponseGroup('MIGRAINE', 'CH001').subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
      done();
    });
  });
});
