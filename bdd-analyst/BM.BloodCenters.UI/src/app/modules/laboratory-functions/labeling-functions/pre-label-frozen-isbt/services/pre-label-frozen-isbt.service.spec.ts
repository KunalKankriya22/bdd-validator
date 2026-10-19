import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PreLabelFrozenIsbtService } from './pre-label-frozen-isbt.service';

describe('PreLabelFrozenIsbtService', () => {
  let service: PreLabelFrozenIsbtService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        PreLabelFrozenIsbtService,
        { provide: HttpClient, useValue: spy },
      ],
    });

    service = TestBed.inject(PreLabelFrozenIsbtService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getPrinterConfig', () => {
    it('should call GET and return printer config', (done) => {
      const mockResponse = { success: true, data: { printerId: 'P1' } };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getPrinterConfig().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('validateAccess', () => {
    it('should call GET and return chapter config', (done) => {
      const mockResponse = { success: true, data: { chapterId: 'C1' } };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.validateAccess().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('validateUnit', () => {
    it('should call POST with request and return validation result', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { success: true, data: { valid: true } };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });

  describe('processLabel', () => {
    it('should call POST with request and return process result', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { success: true, data: { labelId: 'L1' } };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.processLabel(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });

  describe('confirmVerification', () => {
    it('should call POST with request and return boolean response', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { success: true, data: true };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.confirmVerification(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });

  describe('reprint', () => {
    it('should call POST with request and return reprint result', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { success: true, data: { labelId: 'L2' } };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.reprint(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });

  describe('getLovAboValues', () => {
    it('should call GET and return ABO values', (done) => {
      const mockResponse = { success: true, data: [{ code: 'A', description: 'A Pos' }] };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getLovAboValues().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('getLovSpecialTestCodes', () => {
    it('should call GET and return special test codes', (done) => {
      const mockResponse = { success: true, data: [{ code: 'T1', description: 'Test 1' }] };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getLovSpecialTestCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('logAbandonedLabel', () => {
    it('should call POST with request and return boolean response', (done) => {
      const request = { unitId: 'U001', reason: 'Damaged' } as any;
      const mockResponse = { success: true, data: true };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.logAbandonedLabel(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });
});
