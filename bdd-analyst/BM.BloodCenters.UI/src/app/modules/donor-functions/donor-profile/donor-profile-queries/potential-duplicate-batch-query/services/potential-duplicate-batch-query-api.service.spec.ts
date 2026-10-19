import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { PotentialDuplicateBatchQueryApiService } from './potential-duplicate-batch-query-api.service';
import {
  PotentialDuplicateBatch,
  BatchDetails,
  DuplicatePair,
  DuplicateDonor,
  LastNameOption,
  SetIdOption,
  EMPTY_REVIEW_CATEGORY,
  EMPTY_MATCH_FLAGS
} from '../models/potential-duplicate-batch-query.model';

describe('PotentialDuplicateBatchQueryApiService', () => {
  let service: PotentialDuplicateBatchQueryApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PotentialDuplicateBatchQueryApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(PotentialDuplicateBatchQueryApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getBatches', () => {
    it('should return batches for PENDG status', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15T21:20:00Z' },
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15T21:20:00Z' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatches('PENDG').subscribe({
        next: (batches) => {
          expect(batches.length).toBe(1);
          expect(batches[0].status).toBe('PENDG');
          expect(batches[0].batchId).toBe('DP00000033');
          expect(batches[0].donorCount).toBe(2);
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[0]).toBe('/api/v1/potential-duplicate-query');
          expect(call.args[1]?.params?.get('setStatusCode')).toBe('PENDG');
          done();
        }
      });
    });

    it('should return batches for INVAL status', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000034', setStatusCode: 'INVAL', insertDate: '2025-03-14T15:30:00Z' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatches('INVAL').subscribe({
        next: (batches) => {
          expect(batches.length).toBe(1);
          expect(batches[0].status).toBe('INVAL');
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[1]?.params?.get('setStatusCode')).toBe('INVAL');
          done();
        }
      });
    });

    it('should return batches for RESOL status', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000035', setStatusCode: 'RESOL', insertDate: '2025-03-13T10:00:00Z' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatches('RESOL').subscribe({
        next: (batches) => {
          expect(batches.length).toBe(1);
          expect(batches[0].status).toBe('RESOL');
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[1]?.params?.get('setStatusCode')).toBe('RESOL');
          done();
        }
      });
    });

    it('should return all batches when status is not provided', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15T21:20:00Z' },
          { setId: 'DP00000034', setStatusCode: 'INVAL', insertDate: '2025-03-14T15:30:00Z' },
          { setId: 'DP00000035', setStatusCode: 'RESOL', insertDate: '2025-03-13T10:00:00Z' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatches().subscribe({
        next: (batches) => {
          expect(batches.length).toBe(3);
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[1]?.params?.has('setStatusCode')).toBeFalsy();
          done();
        }
      });
    });

    it('should group records by setId correctly', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15T21:20:00Z' },
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15T21:20:00Z' },
          { setId: 'DP00000034', setStatusCode: 'INVAL', insertDate: '2025-03-14T15:30:00Z' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatches().subscribe({
        next: (batches) => {
          expect(batches.length).toBe(2);
          expect(batches[0].donorCount).toBe(2);
          expect(batches[1].donorCount).toBe(1);
          done();
        }
      });
    });



    it('should handle timeout error', (done) => {
      const timeoutError = { name: 'TimeoutError' };
      apiServiceSpy.get.and.returnValue(throwError(() => timeoutError));

      service.getBatches('PENDG').subscribe({
        error: (error) => {
          expect(error.displayMessage).toContain('timed out');
          done();
        }
      });
    });

    it('should handle connection error', (done) => {
      const connectionError = { status: 0 };
      apiServiceSpy.get.and.returnValue(throwError(() => connectionError));

      service.getBatches('PENDG').subscribe({
        error: (error) => {
          expect(error.displayMessage).toContain('Cannot connect to server');
          done();
        }
      });
    });
  });

  describe('getBatchDetails', () => {
    it('should return batch details with duplicate pairs', (done) => {
      const mockResponse = {
        data: [
          {
            setId: 'DP00000033',
            donorId: 'DN20111045',
            setStatusCode: 'PENDG',
            mergeFlag: 'PRIMR',
            insertDate: '2025-03-15T21:20:00Z',
            donorName: 'Christopher Hunter',
            dateOfBirth: '1960-01-11',
            gender: 'Male',
            homePhone: '972-345-6787',
            address: '237 PLEASANT RUN KELLER TX 76248'
          },
          {
            setId: 'DP00000033',
            donorId: 'DN20111046',
            setStatusCode: 'PENDG',
            mergeFlag: 'SECON',
            insertDate: '2025-03-15T21:20:00Z',
            donorName: 'Chris Hunter',
            dateOfBirth: '1960-01-11',
            gender: 'Male',
            homePhone: '972-345-6788',
            address: '237 PLEASANT RUN KELLER TX 76248'
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatchDetails('DP00000033').subscribe({
        next: (details) => {
          expect(details.batch.batchId).toBe('DP00000033');
          expect(details.batch.status).toBe('PENDG');
          expect(details.duplicatePairs.length).toBe(1);
          expect(details.duplicatePairs[0]!.primaryDonor!.donorId).toBe('DN20111045');
          expect(details.duplicatePairs[0]!.secondaryDonor!.donorId).toBe('DN20111046');
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[0]).toBe('/api/v1/potential-duplicate-query');
          expect(call.args[1]?.params?.get('setId')).toBe('DP00000033');
          done();
        }
      });
    });

    it('should transform donor fields correctly', (done) => {
      const mockResponse = {
        data: [
          {
            setId: 'DP00000033',
            donorId: 'DN20111045',
            setStatusCode: 'PENDG',
            mergeFlag: 'PRIMR',
            insertDate: '2025-03-15T21:20:00Z',
            donorName: 'Christopher Hunter',
            dateOfBirth: '1960-01-11',
            gender: 'Male',
            homePhone: '972-345-6787',
            workPhone: '469-123-4567',
            mobilePhone: '469-999-0000',
            ssn: '***-**-1234',
            address: '237 PLEASANT RUN KELLER TX 76248',
            resolveUserName: 'Jane Smith',
            resolveDate: '2025-03-15T22:00:00Z',
            comments: 'Test comment',
            programId: 'PROG1',
            chapterId: 'CH1'
          },
          {
            setId: 'DP00000033',
            donorId: 'DN20111046',
            setStatusCode: 'PENDG',
            mergeFlag: 'SECON',
            insertDate: '2025-03-15T21:20:00Z',
            donorName: 'Chris Hunter',
            dateOfBirth: '1960-01-11',
            gender: 'Male'
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBatchDetails('DP00000033').subscribe({
        next: (details) => {
          const primary = details.duplicatePairs[0]!.primaryDonor!;
          expect(primary.name).toBe('Christopher Hunter');
          expect(primary.dateOfBirth).toBe('1960-01-11');
          expect(primary.sex).toBe('Male');
          expect(primary.homePhone).toBe('972-345-6787');
          expect(primary.workPhone).toBe('469-123-4567');
          expect(primary.mobilePhone).toBe('469-999-0000');
          expect(primary.ssn).toBe('***-**-1234');
          expect(primary.address).toBe('237 PLEASANT RUN KELLER TX 76248');
          expect(primary.resolvedByUser).toBe('Jane Smith');
          expect(primary.dateResolved).toBe('2025-03-15T22:00:00Z');
          expect(primary.comments).toBe('Test comment');
          expect(primary.programId).toBe('PROG1');
          expect(primary.setId).toBe('DP00000033');

          const secondary = details.duplicatePairs[0]!.secondaryDonor!;
          expect(secondary.name).toBe('Chris Hunter');
          expect(secondary.homePhone).toBeNull();
          expect(secondary.workPhone).toBeNull();
          expect(secondary.mobilePhone).toBeNull();
          expect(secondary.ssn).toBeNull();
          expect(secondary.address).toBeNull();
          done();
        }
      });
    });

    it('should handle empty records', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getBatchDetails('DP00000033').subscribe({
        next: (details) => {
          expect(details.batch.batchId).toBe('DP00000033');
          expect(details.batch.status).toBe('PENDG');
          expect(details.duplicatePairs.length).toBe(0);
          expect(details.totalPairs).toBe(0);
          done();
        }
      });
    });

    it('should handle error when batch not found', (done) => {
      const errorResponse = { error: { message: 'Batch not found' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getBatchDetails('INVALID').subscribe({
        error: (error) => {
          expect(error.displayMessage).toBe('Batch not found');
          done();
        }
      });
    });
  });

  describe('checkDonor', () => {
    it('should send Y for checked and N for unchecked sections', (done) => {
      const request = {
        donorId: 'DN20111045',
        batchId: 'DP00000033',
        sectionsChecked: ['demographics', 'interdictions']
      };

      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.checkDonor(request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          const expectedDto = {
            demographicsCheck: 'Y',
            keydataCheck: 'N',
            interdictionsCheck: 'Y',
            donationsCheck: 'N',
            attributesCheck: 'N'
          };
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            '/api/v1/potential-duplicate-query/DP00000033/DN20111045',
            expectedDto
          );
          done();
        }
      });
    });

    it('should handle error when checking donor fails', (done) => {
      const request = {
        donorId: 'DN20111045',
        batchId: 'DP00000033',
        sectionsChecked: ['demographics']
      };

      const errorResponse = { error: { message: 'Failed to check donor' } };
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.checkDonor(request).subscribe({
        error: (error) => {
          expect(error.displayMessage).toBe('Failed to check donor');
          done();
        }
      });
    });
  });

  describe('resolveDuplicate', () => {
    it('should successfully resolve duplicate', (done) => {
      const request = {
        pairId: 'PAIR-001',
        batchId: 'DP00000033',
        resolution: 'Merge' as const,
        primaryDonorId: 'DN20111045',
        secondaryDonorId: 'DN20111046'
      };

      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.resolveDuplicate(request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            '/api/v1/potential-duplicate-query/DP00000033/resolve',
            {}
          );
          done();
        }
      });
    });

    it('should handle error when resolving duplicate fails', (done) => {
      const request = {
        pairId: 'PAIR-001',
        batchId: 'DP00000033',
        resolution: 'NotDuplicate' as const
      };

      const errorResponse = { error: { message: 'Failed to resolve duplicate' } };
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.resolveDuplicate(request).subscribe({
        error: (error) => {
          expect(error.displayMessage).toBe('Failed to resolve duplicate');
          done();
        }
      });
    });
  });

  describe('getLastNames', () => {
    it('should return list of LastNameOption objects', (done) => {
      const mockResponse = {
        data: [
          { lastName: 'Smith', setId: 'DP00000033', foundOn: '2025-01-01', setStatusCode: 'PENDG', source: 'Registration' },
          { lastName: 'Jones', setId: 'DP00000034', foundOn: '2025-01-02', setStatusCode: 'PENDG', source: null },
          { lastName: 'Brown', setId: 'DP00000035', foundOn: null, setStatusCode: 'INVAL', source: 'Key' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLastNames().subscribe({
        next: (names) => {
          expect(names.length).toBe(3);
          expect(names[0].lastName).toBe('Smith');
          expect(names[0].setId).toBe('DP00000033');
          expect(names[0].source).toBe('Registration');
          expect(names[1].lastName).toBe('Jones');
          expect(names[2].setStatusCode).toBe('INVAL');
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[0]).toBe('/api/v1/potential-duplicate-query/lovs/last-names');
          done();
        }
      });
    });



  });

  describe('getSetIds', () => {
    it('should return list of SetIdOption objects', (done) => {
      const mockResponse = {
        data: [
          { setId: 'DP00000033', setStatusCode: 'PENDG', insertDate: '2025-03-15', donorCount: 2, source: 'Registration' },
          { setId: 'DP00000034', setStatusCode: 'INVAL', insertDate: '2025-03-14', donorCount: 3, source: null },
          { setId: 'DP00000035', setStatusCode: 'RESOL', insertDate: '2025-03-13', donorCount: 1, source: 'Key' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetIds().subscribe({
        next: (ids) => {
          expect(ids.length).toBe(3);
          expect(ids[0].setId).toBe('DP00000033');
          expect(ids[0].source).toBe('Registration');
          expect(ids[0].donorCount).toBe(2);
          expect(ids[1].setId).toBe('DP00000034');
          expect(ids[2].setId).toBe('DP00000035');
          const call = apiServiceSpy.get.calls.mostRecent();
          expect(call.args[0]).toBe('/api/v1/potential-duplicate-query/lovs/set-ids');
          done();
        }
      });
    });



  });

  describe('getMergeStatuses', () => {
    it('should return list of merge statuses', (done) => {
      const mockResponse = {
        data: [
          { code: 'NOMER', description: 'No Merge' },
          { code: 'PRIMR', description: 'Primary' },
          { code: 'SECON', description: 'Secondary' },
          { code: 'FALSE', description: 'False Duplicate' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getMergeStatuses().subscribe({
        next: (statuses) => {
          expect(statuses.length).toBe(4);
          expect(statuses[0].code).toBe('NOMER');
          expect(statuses[0].description).toBe('No Merge');
          expect(statuses[1].code).toBe('PRIMR');
          done();
        }
      });
    });


  });

  describe('updateSetStatus', () => {
    it('should call PUT with status code', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.updateSetStatus('DP00000033', { statusCode: 'INVAL' }).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            '/api/v1/potential-duplicate-query/DP00000033/status',
            { statusCode: 'INVAL' }
          );
          done();
        }
      });
    });
  });

  describe('createSet', () => {
    it('should call POST with donorId', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, setId: 'DP00000099' }));

      service.createSet({ donorId: 'DN20111045' }).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/potential-duplicate-query',
            { donorId: 'DN20111045' }
          );
          done();
        }
      });
    });
  });

  describe('updateMergeFlag', () => {
    it('should call PUT with merge flag', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.updateMergeFlag('DP00000033', 'DN20111045', 'PRIMR').subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            '/api/v1/potential-duplicate-query/DP00000033/DN20111045/merge-flag',
            { mergeFlag: 'PRIMR' }
          );
          done();
        }
      });
    });
  });

});
