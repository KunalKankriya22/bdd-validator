import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpecialDriveService } from './special-drive.service';
import { ApiService } from '@shared/services/api.service';

describe('SpecialDriveService', () => {
  let service: SpecialDriveService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpecialDriveService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(SpecialDriveService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDrives', () => {
    it('should call POST and return paginated drives', (done) => {
      const mockResponse = { success: true, data: [{ driveId: 'D1' }], total: 1 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDrives(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array and total to 0 when response fields are falsy', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.searchDrives(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('search failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.searchDrives(10, 0, {} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getDriveById', () => {
    it('should call GET and return drive details', (done) => {
      const mockDrive = { driveId: 'D1', driveName: 'Test Drive' };
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockDrive }));

      service.getDriveById('D1', 'CH1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDrive as any);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('get by id failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDriveById('D1', 'CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('createDrive', () => {
    it('should call POST with request and return response', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createDrive({ driveName: 'New' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('create failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createDrive({ driveName: 'New' } as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('updateDrive', () => {
    it('should call PUT with request and return response', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateDrive({ driveId: 'D1' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('update failed');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateDrive({ driveId: 'D1' } as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('deleteDrive', () => {
    it('should call DELETE with drive ID', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteDrive('D1').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('delete failed');
      apiServiceSpy.delete.and.returnValue(throwError(() => error));

      service.deleteDrive('D1', 'CH1', 'CODE', 'reason').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('recreateDrive', () => {
    it('should call POST with request and return response', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.recreateDrive({ driveId: 'D1' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('recreate failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.recreateDrive({ driveId: 'D1' } as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getDriveIds', () => {
    it('should call GET and return drive IDs', (done) => {
      const mockResponse = { success: true, data: [{ driveId: 'D1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDriveIds('CH1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getDriveIds('CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getDriveIds failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDriveIds('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getDriveCategories', () => {
    it('should call GET and return categories', (done) => {
      const mockResponse = { success: true, data: [{ category: 'C1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDriveCategories().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getDriveCategories().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getDriveCategories failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDriveCategories().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getResources', () => {
    it('should call GET and return resources', (done) => {
      const mockResponse = { success: true, data: [{ resourceId: 'R1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getResources('CH1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getResources('CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getResources failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getResources('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getSponsors', () => {
    it('should call POST and return sponsors', (done) => {
      const mockResponse = { success: true, data: [{ sponsorId: 'S1' }] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getSponsors('CH1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.getSponsors('CH1', 'test', 50, 10).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getSponsors failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.getSponsors('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getLocations', () => {
    it('should call GET and return locations', (done) => {
      const mockResponse = { success: true, data: [{ locationId: 'L1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLocations('CH1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getLocations('CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getLocations failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getLocations('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getRecruiters', () => {
    it('should call GET and return recruiters', (done) => {
      const mockResponse = { success: true, data: [{ recruiterId: 'RC1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getRecruiters('CH1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getRecruiters('CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getRecruiters failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getRecruiters('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getCancelCodes', () => {
    it('should call GET and return cancel codes', (done) => {
      const mockResponse = { success: true, data: [{ code: 'CC1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCancelCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('should default data to empty array when response data is falsy', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getCancelCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error through catchError', (done) => {
      const error = new Error('getCancelCodes failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getCancelCodes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
