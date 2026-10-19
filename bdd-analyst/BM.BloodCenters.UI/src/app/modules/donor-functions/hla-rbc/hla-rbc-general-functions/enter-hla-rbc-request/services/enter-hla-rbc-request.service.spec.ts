import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EnterHlaRbcRequestService } from './enter-hla-rbc-request.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('EnterHlaRbcRequestService', () => {
  let service: EnterHlaRbcRequestService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }],
    });
    service = TestBed.inject(EnterHlaRbcRequestService);
  });

  // ─── LOV-pattern methods ──────────────────────────────────────────────────

  describe('LOV lookup methods', () => {
    const lovCases: { method: string; args?: any[] }[] = [
      { method: 'getAboCodes' },
      { method: 'getHlaLocus' },
      { method: 'getHlaEpitopes', args: ['A'] },
      { method: 'getHlaEpitopesByLocus', args: ['A'] },
      { method: 'getRbcTests' },
      { method: 'getProducts' },
      { method: 'getPriorities' },
      { method: 'getAttributeGroups' },
      { method: 'getAttributeCodes', args: ['GRP1'] },
    ];

    it.each(lovCases)('$method should return LovOption[] from response.data', ({ method, args }, done: DoneFn) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'C1', description: 'Code One' },
          { code: 'C2', description: '' },
        ],
      };
      apiSpy.get.and.returnValue(of(mockResponse));

      (service as any)[method](...(args ?? [])).subscribe({
        next: (result: any[]) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ value: 'C1', label: 'Code One' });
          expect(result[1]).toEqual({ value: 'C2', label: 'C2' });
          done();
        },
      });
    });

    it.each(lovCases)('$method should handle bare array response', ({ method, args }, done: DoneFn) => {
      const bareArray = [{ code: 'X1', description: 'Bare' }];
      apiSpy.get.and.returnValue(of(bareArray as any));

      (service as any)[method](...(args ?? [])).subscribe({
        next: (result: any[]) => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({ value: 'X1', label: 'Bare' });
          done();
        },
      });
    });

    it.each(lovCases)('$method should return empty array when data is empty', ({ method, args }, done: DoneFn) => {
      apiSpy.get.and.returnValue(of({ success: true, data: [] }));

      (service as any)[method](...(args ?? [])).subscribe({
        next: (result: any[]) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it.each(lovCases)('$method should propagate error on API failure', ({ method, args }, done: DoneFn) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      (service as any)[method](...(args ?? [])).subscribe({
        next: () => done.fail('expected error'),
        error: (err: any) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });

    it.each(lovCases)('$method should return empty array when response is null', ({ method, args }, done: DoneFn) => {
      apiSpy.get.and.returnValue(of(null as any));

      (service as any)[method](...(args ?? [])).subscribe({
        next: (result: any[]) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  // ─── getPatients ──────────────────────────────────────────────────────────

  describe('getPatients', () => {
    it('should return data array from response', (done) => {
      const patients = [{ patId: 'P1', patLastName: 'Smith', status: 'A' }];
      apiSpy.get.and.returnValue(of({ success: true, data: patients }));

      service.getPatients().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].patId).toBe('P1');
          done();
        },
      });
    });

    it('should handle bare array response', (done) => {
      const patients = [{ patId: 'P2', patLastName: 'Doe', status: 'A' }];
      apiSpy.get.and.returnValue(of(patients as any));

      service.getPatients().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].patId).toBe('P2');
          done();
        },
      });
    });

    it('should return empty array when response has no data', (done) => {
      apiSpy.get.and.returnValue(of({ success: true } as any));

      service.getPatients().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getPatients().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── getHospitals ─────────────────────────────────────────────────────────

  describe('getHospitals', () => {
    it('should map customerId and name to LovOption', (done) => {
      const hospitals = [{ customerId: 'H1', name: 'General Hospital', city: 'Dallas' }];
      apiSpy.get.and.returnValue(of({ success: true, data: hospitals }));

      service.getHospitals().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({ value: 'H1', label: 'General Hospital' });
          done();
        },
      });
    });

    it('should handle bare array response', (done) => {
      const hospitals = [{ customerId: 'H2', name: 'City Hospital' }];
      apiSpy.get.and.returnValue(of(hospitals as any));

      service.getHospitals().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({ value: 'H2', label: 'City Hospital' });
          done();
        },
      });
    });

    it('should return empty array when response has no data', (done) => {
      apiSpy.get.and.returnValue(of({ success: true } as any));

      service.getHospitals().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getHospitals().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── getPhysicians ────────────────────────────────────────────────────────

  describe('getPhysicians', () => {
    const physicianCases = [
      {
        scenario: 'with firstName',
        data: [{ phyId: 'PH1', lastName: 'Smith', firstName: 'John' }],
        expected: { value: 'PH1', label: 'Smith, John' },
      },
      {
        scenario: 'without firstName',
        data: [{ phyId: 'PH2', lastName: 'Jones' }],
        expected: { value: 'PH2', label: 'Jones' },
      },
    ];

    it.each(physicianCases)('should map physician $scenario', ({ data, expected }, done: DoneFn) => {
      apiSpy.get.and.returnValue(of({ success: true, data }));

      service.getPhysicians().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual(expected);
          done();
        },
      });
    });

    it('should handle bare array response', (done) => {
      const physicians = [{ phyId: 'PH3', lastName: 'Lee', firstName: 'Amy' }];
      apiSpy.get.and.returnValue(of(physicians as any));

      service.getPhysicians().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({ value: 'PH3', label: 'Lee, Amy' });
          done();
        },
      });
    });

    it('should return empty array when response has no data', (done) => {
      apiSpy.get.and.returnValue(of({ success: true } as any));

      service.getPhysicians().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getPhysicians().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── getPatientDetail ─────────────────────────────────────────────────────

  describe('getPatientDetail', () => {
    const detailCases = [
      {
        scenario: 'success with item',
        response: { success: true, item: { patId: 'P1', patLastName: 'Smith', status: 'A' } },
        expected: { patId: 'P1', patLastName: 'Smith', status: 'A' },
      },
      {
        scenario: 'not success',
        response: { success: false, item: null },
        expected: null,
      },
    ];

    it.each(detailCases)('should return $expected when $scenario', ({ response, expected }, done: DoneFn) => {
      apiSpy.get.and.returnValue(of(response));

      service.getPatientDetail('P1').subscribe({
        next: (result) => {
          if (expected === null) {
            expect(result).toBeNull();
          } else {
            expect(result).toEqual(jasmine.objectContaining(expected));
          }
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getPatientDetail('P1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── getPatientRequests ───────────────────────────────────────────────────

  describe('getPatientRequests', () => {
    it('should return data array when success', (done) => {
      const requests = [{ requestId: 'R1', requestedDate: '2026-01-01' }];
      apiSpy.get.and.returnValue(of({ success: true, data: requests }));

      service.getPatientRequests('P1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].requestId).toBe('R1');
          done();
        },
      });
    });

    it('should return empty array when not success', (done) => {
      apiSpy.get.and.returnValue(of({ success: false }));

      service.getPatientRequests('P1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getPatientRequests('P1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── getRequestDetail ─────────────────────────────────────────────────────

  describe('getRequestDetail', () => {
    it('should return item when success', (done) => {
      const detail = { requestId: 'R1', patientId: 'P1' };
      apiSpy.get.and.returnValue(of({ success: true, item: detail }));

      service.getRequestDetail('R1').subscribe({
        next: (result) => {
          expect(result).toEqual(jasmine.objectContaining({ requestId: 'R1' }));
          done();
        },
      });
    });

    it('should return null when not success', (done) => {
      apiSpy.get.and.returnValue(of({ success: false }));

      service.getRequestDetail('R1').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => apiError));

      service.getRequestDetail('R1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ─── saveRequest ──────────────────────────────────────────────────────────

  describe('saveRequest', () => {
    it('should return item on success', (done) => {
      const saved = { patId: 'P1', requestId: 'R1' };
      apiSpy.post.and.returnValue(of({ success: true, item: saved }));

      service.saveRequest({ patLastName: 'Test' } as any).subscribe({
        next: (result) => {
          expect(result).toEqual(jasmine.objectContaining({ requestId: 'R1' }));
          done();
        },
      });
    });

    it('should throw error on failure with message', (done) => {
      apiSpy.post.and.returnValue(of({ success: false, message: 'Validation error' }));

      service.saveRequest({ patLastName: 'Test' } as any).subscribe({
        error: (err) => {
          expect(err.message).toContain('Validation error');
          done();
        },
      });
    });

    it('should throw default error message when no message provided', (done) => {
      apiSpy.post.and.returnValue(of({ success: false }));

      service.saveRequest({ patLastName: 'Test' } as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Save failed');
          done();
        },
      });
    });

    it('should propagate error on API failure', (done) => {
      const apiError = new Error('Server error');
      apiSpy.post.and.returnValue(throwError(() => apiError));

      service.saveRequest({ patLastName: 'Test' } as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });
});
