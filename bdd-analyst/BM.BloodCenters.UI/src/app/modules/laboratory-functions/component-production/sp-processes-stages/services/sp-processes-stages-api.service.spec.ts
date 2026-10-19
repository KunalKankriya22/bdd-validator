import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpProcessesStagesApiService } from './sp-processes-stages-api.service';
import { ApiService } from '@shared/services/api.service';
import { BulkUpsertRequest } from '../models/sp-processes-stages.model';

describe('SpProcessesStagesApiService', () => {
  let service: SpProcessesStagesApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpProcessesStagesApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(SpProcessesStagesApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getProcessCodes', () => {
    it('should return process codes', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'DEGLY', codeDesc: 'Deglycerolization' },
          { code: 'FROZ', codeDesc: 'Freezing' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessCodes().subscribe(processes => {
        expect(processes.length).toBe(2);
        expect(processes[0].code).toBe('DEGLY');
        expect(processes[0].description).toBe('Deglycerolization');
        expect(apiServiceSpy.get).toHaveBeenCalled();
        done();
      });
    });

    it('should fall back to description when codeDesc is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'X', description: 'Fallback' }] }));
      service.getProcessCodes().subscribe(p => {
        expect(p[0].description).toBe('Fallback');
        done();
      });
    });

    it('should return empty string when both codeDesc and description are null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'X' }] }));
      service.getProcessCodes().subscribe(p => {
        expect(p[0].description).toBe('');
        done();
      });
    });

    it('should return empty array when data is not an array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));
      service.getProcessCodes().subscribe(p => {
        expect(p).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiServiceSpy.get.and.returnValue(of(null));
      service.getProcessCodes().subscribe(p => {
        expect(p).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));
      service.getProcessCodes().subscribe({
        error: (e) => { expect(e.message).toBe('fail'); done(); }
      });
    });
  });

  describe('getStageCodes', () => {
    it('should return stage codes', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: '01', codeDesc: '1st stage' },
          { code: '02', codeDesc: '2nd stage' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getStageCodes().subscribe(stages => {
        expect(stages.length).toBe(2);
        expect(stages[0].code).toBe('01');
        expect(stages[0].description).toBe('1st stage');
        done();
      });
    });

    it('should fall back to description when codeDesc is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: '01', description: 'Fallback' }] }));
      service.getStageCodes().subscribe(s => {
        expect(s[0].description).toBe('Fallback');
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));
      service.getStageCodes().subscribe(s => {
        expect(s).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));
      service.getStageCodes().subscribe({
        error: (e) => { expect(e.message).toBe('fail'); done(); }
      });
    });
  });

  describe('getStages', () => {
    it('should return stages for a process code', (done) => {
      const mockResponse = {
        success: true,
        totalCount: 1,
        data: [{
          processCode: 'DEGLY',
          processDesc: 'Deglycerolization',
          stageCode: '01',
          stageCodeDesc: '1st stage',
          effDate: '27-May-2026',
          termDate: null,
          lastModifiedDate: null,
          programId: 'VPROCSTA',
          auditKey: 123,
        }],
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getStages({ processCode: 'DEGLY' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].processCode).toBe('DEGLY');
        expect(result.totalRecords).toBe(1);
        done();
      });
    });

    it('should use defaults for missing query params', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [], totalCount: 0 }));
      service.getStages({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        const body = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(body.activeOnly).toBe(true);
        expect(body.processCode).toBeNull();
        done();
      });
    });

    it('should return empty array when data is not an array', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: null, totalCount: 0 }));
      service.getStages({}).subscribe(result => {
        expect(result.data).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('fail')));
      service.getStages({}).subscribe({
        error: (e) => { expect(e.message).toBe('fail'); done(); }
      });
    });
  });

  describe('bulkUpsert', () => {
    it('should send bulk upsert request', (done) => {
      const request: BulkUpsertRequest = {
        records: [{
          auditKey: null,
          processCode: 'DEGLY',
          stageCode: '01',
          effDate: '2026-05-27',
          termDate: null,
        }],
      };
      const mockResponse = {
        totalRecords: 1,
        createdCount: 1,
        updatedCount: 0,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: 'Process Stages updated successfully.',
        errorCode: null,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.bulkUpsert(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.createdCount).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('fail')));
      service.bulkUpsert({ records: [] }).subscribe({
        error: (e) => { expect(e.message).toBe('fail'); done(); }
      });
    });
  });

  describe('deleteStage', () => {
    it('should delete a stage', (done) => {
      apiServiceSpy.delete.and.returnValue(of({ success: true, message: 'Record deleted successfully' }));

      service.deleteStage('DEGLY', '01').subscribe(response => {
        expect(response.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => new Error('fail')));
      service.deleteStage('DEGLY', '01').subscribe({
        error: (e) => { expect(e.message).toBe('fail'); done(); }
      });
    });
  });
});
