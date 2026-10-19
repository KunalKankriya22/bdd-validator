import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { InvestigateDuplicateDonorRecordsApiService } from './investigate-duplicate-donor-records-api.service';

describe('InvestigateDuplicateDonorRecordsApiService', () => {
  let service: InvestigateDuplicateDonorRecordsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSetRecords = [
    {
      setId: 'DP00000033',
      setStatusCode: 'PENDG',
      insertDate: '2025-03-15T21:20:00Z',
      source: 'Registration',
      programId: 'DRUREHLD',
      duplicateCount: 2,
      reviewProgress: { demographics: 1, keydata: 0, interdictions: 0, donations: 0, attributes: 0 }
    }
  ];

  const mockDonorRecords = [
    {
      donorId: 'DN30132192',
      setId: 'DP00000033',
      setStatusCode: 'PENDG',
      donorName: 'Shelia Rogers',
      dateOfBirth: '1994-01-11',
      gender: 'F',
      mergeFlag: 'PRIMR',
      address: '82 LONG 13E DALLAS TX 75235',
      altAddress: '123 ALT STREET',
      workPhone: '214-885-1214',
      homePhone: '214-558-4545',
      demographics: { isChecked: 'Y', reviewUser: 'AWPETER', reviewUserName: 'Ann Walton Peter', reviewDate: '2025-03-15T21:20:00Z' },
      keydata: null,
      interdictions: null,
      donations: null,
      attributes: null,
      matchFlags: { lastName: 'Y', ssn: 'N', dob: 'Y', sex: 'Y' },
      resolveUser: null,
      resolveUserName: null,
      resolveDate: null,
      programId: 'DRUREHLD',
      chapterId: '001'
    },
    {
      donorId: 'DN30132273',
      setId: 'DP00000033',
      setStatusCode: 'PENDG',
      donorName: 'Shelia Panerahe',
      dateOfBirth: '1994-01-11',
      gender: 'F',
      mergeFlag: 'NOMER',
      address: '234 CHANEL DRIVE DALLAS TX 75235',
      altAddress: null,
      workPhone: null,
      homePhone: '214-332-1834'
    }
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'put', 'post']);

    TestBed.configureTestingModule({
      providers: [
        InvestigateDuplicateDonorRecordsApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(InvestigateDuplicateDonorRecordsApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDuplicateSets', () => {
    it('should return batches from POST /sets', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockSetRecords }));

      let result: any;
      service.getDuplicateSets({ statusCode: 'PENDG' }).subscribe(r => result = r);
      tick();

      expect(result).toBeTruthy();
      expect(result.length).toBe(1);
      expect(result[0].batchId).toBe('DP00000033');
      expect(result[0].setStatusCode).toBe('PENDG');
      expect(result[0].source).toBe('Registration');
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets',
        { statusCode: 'PENDG' }
      );
    }));


    it('should handle timeout error', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ name: 'TimeoutError' })));

      let error: any;
      service.getDuplicateSets({}).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toContain('timed out');
    }));
  });

  describe('getPotentialDuplicates', () => {
    it('should return batch details with donors', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockDonorRecords }));

      let result: any;
      service.getPotentialDuplicates('DP00000033').subscribe(r => result = r);
      tick();

      expect(result).toBeTruthy();
      expect(result.batch.batchId).toBe('DP00000033');
      expect(result.donors.length).toBe(2);
      expect(result.donors[0].donorId).toBe('DN30132192');
      expect(result.donors[0].name).toBe('Shelia Rogers');
      expect(result.donors[0].gender).toBe('F');
    }));

    it('should transform donor demographics review category', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockDonorRecords }));

      let result: any;
      service.getPotentialDuplicates('DP00000033').subscribe(r => result = r);
      tick();

      expect(result.donors[0].demographics.isChecked).toBe('Y');
      expect(result.donors[0].demographics.reviewUserName).toBe('Ann Walton Peter');
    }));




    it('should call correct endpoint', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getPotentialDuplicates('DP00000033').subscribe();
      tick();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DP00000033/potential-duplicates',
        {}
      );
    }));
  });

  describe('updateReviewCategory', () => {
    it('should update review category', fakeAsync(() => {
      const mockResponse = {
        success: true,
        data: [{ setId: 'DP00000033', donorId: 'DN30132192', category: 'Demographics', isChecked: 'Y', reviewUser: 'USR001', reviewDate: '2025-05-20T15:30:00' }]
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      let result: any;
      service.updateReviewCategory('DP00000033', 'DN30132192', {
        category: 'Demographics',
        isChecked: true
      }).subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(result.data[0].isChecked).toBe('Y');
      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DP00000033/donors/DN30132192/review',
        { category: 'Demographics', isChecked: true }
      );
    }));

  });

  describe('updateMergeFlag', () => {
    it('should update merge flag', fakeAsync(() => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: [{ setId: 'DP00000033', donorId: 'DN30132192', mergeFlag: 'PRIMR' }]
      }));

      let result: any;
      service.updateMergeFlag('DP00000033', 'DN30132192', { mergeFlag: 'PRIMR' }).subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DP00000033/donors/DN30132192/merge-flag',
        { mergeFlag: 'PRIMR' }
      );
    }));

    it('should handle mutual exclusivity error', fakeAsync(() => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Another donor in this set is already marked as Primary' }
      })));

      let error: any;
      service.updateMergeFlag('DP00000033', 'DN30132192', { mergeFlag: 'PRIMR' }).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Another donor in this set is already marked as Primary');
    }));
  });

  describe('updateSetStatus', () => {
    it('should update set status', fakeAsync(() => {
      apiServiceSpy.put.and.returnValue(of({
        success: true,
        data: [{ setId: 'DP00000033', statusCode: 'INVAL', updatedRecords: 2 }]
      }));

      let result: any;
      service.updateSetStatus('DP00000033', { statusCode: 'INVAL' }).subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DP00000033/status',
        { statusCode: 'INVAL' }
      );
    }));

  });

  describe('resolveSet', () => {
    it('should resolve set', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ setId: 'DP00000033', resolveUser: 'USR001', resolveDate: '2025-05-20T15:45:00', resolvedDonors: 2 }]
      }));

      let result: any;
      service.resolveSet('DP00000033').subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DP00000033/resolve',
        {}
      );
    }));

    it('should handle incomplete merge flags error', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'All donors must have merge flags assigned before resolving' }
      })));

      let error: any;
      service.resolveSet('DP00000033').subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('All donors must have merge flags assigned before resolving');
    }));
  });

  describe('getStatusCodes', () => {
    it('should return status codes', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        data: [
          { statusCode: 'PENDG', description: 'Pending' },
          { statusCode: 'INVAL', description: 'Invalid' }
        ]
      }));

      let result: any;
      service.getStatusCodes().subscribe(r => result = r);
      tick();

      expect(result.length).toBe(2);
      expect(result[0].statusCode).toBe('PENDG');
      expect(result[0].description).toBe('Pending');
    }));

  });

  describe('createSet', () => {
    it('should call POST to CREATE_SET endpoint', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ setId: 'DUPLI09883' }],
        message: 'New set created'
      }));

      service.createSet().subscribe();
      tick();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/create',
        {}
      );
    }));

    it('should return set ID on success', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ setId: 'DUPLI09883' }],
        message: 'New set created'
      }));

      let result: any;
      service.createSet().subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(result.data[0].setId).toBe('DUPLI09883');
    }));

    it('should handle error with displayMessage', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({
        status: 500,
        error: { message: 'Internal server error' }
      })));

      let error: any;
      service.createSet().subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Internal server error');
    }));
  });

  describe('addDonorToSet', () => {
    it('should call POST to ADD_DONOR_TO_SET endpoint with donor ID', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ donorId: 'DN30132192', setId: 'DUPLI09883' }],
        message: 'Donor added'
      }));

      service.addDonorToSet('DUPLI09883', { donorId: 'DN30132192' }).subscribe();
      tick();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/duplicate-investigations/sets/DUPLI09883/donors',
        { donorId: 'DN30132192' }
      );
    }));

    it('should return success response', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: [{ donorId: 'DN30132192', setId: 'DUPLI09883' }],
        message: 'Donor added successfully'
      }));

      let result: any;
      service.addDonorToSet('DUPLI09883', { donorId: 'DN30132192' }).subscribe(r => result = r);
      tick();

      expect(result.success).toBeTrue();
      expect(result.message).toBe('Donor added successfully');
    }));

    it('should handle error with displayMessage', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Donor already exists in set' }
      })));

      let error: any;
      service.addDonorToSet('DUPLI09883', { donorId: 'DN30132192' }).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Donor already exists in set');
    }));
  });

  describe('getDuplicateSets - error paths', () => {
    it('should return CORS message on connection error (status 0)', fakeAsync(() => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 0 })));

      let error: any;
      service.getDuplicateSets({}).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toContain('Cannot connect to server');
    }));
  });

  describe('getPotentialDuplicates - edge cases', () => {
    it('should return default batch structure for empty records', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      let result: any;
      service.getPotentialDuplicates('DP00000099').subscribe(r => result = r);
      tick();

      expect(result.batch.batchId).toBe('DP00000099');
      expect(result.batch.setStatusCode).toBe('PENDG');
      expect(result.donors.length).toBe(0);
    }));

    it('should handle error with displayMessage', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({
        status: 500,
        error: { message: 'Database error' }
      })));

      let error: any;
      service.getPotentialDuplicates('DP00000033').subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Database error');
    }));
  });

  describe('updateReviewCategory - error', () => {
    it('should handle error with displayMessage', fakeAsync(() => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Invalid category' }
      })));

      let error: any;
      service.updateReviewCategory('DP00000033', 'DN30132192', {
        category: 'Demographics',
        isChecked: true
      }).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Invalid category');
    }));
  });

  describe('updateSetStatus - error', () => {
    it('should handle error with displayMessage', fakeAsync(() => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Cannot update resolved set' }
      })));

      let error: any;
      service.updateSetStatus('DP00000033', { statusCode: 'INVAL' }).subscribe({ error: (e) => error = e });
      tick();

      expect(error.displayMessage).toBe('Cannot update resolved set');
    }));
  });
});
