import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExtAntApprovalService } from './ext-ant-approval.service';
import { ApiService } from '@shared/services/api.service';

describe('ExtAntApprovalService', () => {
  let service: ExtAntApprovalService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ExtAntApprovalService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ExtAntApprovalService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('search', () => {
    it('should call POST with pagination and params', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.search(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should call POST with DTOs', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create([{ prefix: 'P1' } as any]).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should call PUT with DTOs', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update([{ auditKey: 1 } as any]).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should call DELETE with audit key', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.delete(123).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getFilterOptions', () => {
    it('should call GET and return filter options', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ option: 'O1' }], total: 1, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('getLookupPrefixes', () => {
    it('should call GET and return lookup prefixes', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ prefix: 'P1' }], total: 1, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLookupPrefixes().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('getLookupAntigenTests', () => {
    it('should call GET and return antigen tests', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ test: 'AT1' }], total: 1, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLookupAntigenTests().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('checkPrefixExists', () => {
    it('should call POST with prefix string', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.checkPrefixExists('ABC').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
