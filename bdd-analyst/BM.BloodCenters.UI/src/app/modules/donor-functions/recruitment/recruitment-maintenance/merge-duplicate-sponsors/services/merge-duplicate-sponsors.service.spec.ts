import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MergeDuplicateSponsorsService } from './merge-duplicate-sponsors.service';
import { ApiService } from '@shared/services/api.service';

describe('MergeDuplicateSponsorsService', () => {
  let service: MergeDuplicateSponsorsService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        MergeDuplicateSponsorsService,
        { provide: ApiService, useValue: apiService },
      ],
    });
    service = TestBed.inject(MergeDuplicateSponsorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchSponsorsLov', () => {
    const params = { sponsorName: 'Acme', chapterId: 'CH01' };

    it('should POST to sponsors-lov endpoint with take/skip', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.searchSponsorsLov(50, 0, params).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        expect(callArgs[0]).toContain('/sponsors-lov/50/0');
        expect(callArgs[1]).toBe(params);
        done();
      });
    });

    it('should map response data and total', (done) => {
      const sponsors = [
        { name: 'Acme Corp', sponsorId: 'S001' },
        { name: 'Acme Ltd', sponsorId: 'S002' },
      ];
      apiService.post.and.returnValue(of({ data: sponsors, total: 2 }));

      service.searchSponsorsLov(50, 0, params).subscribe((result) => {
        expect(result.data).toEqual(sponsors as any);
        expect(result.total).toBe(2);
        done();
      });
    });

    it('should default to empty array and zero total when response is null', (done) => {
      apiService.post.and.returnValue(of(null as any));

      service.searchSponsorsLov(50, 0, params).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 500 };
      apiService.post.and.returnValue(throwError(() => error));

      service.searchSponsorsLov(50, 0, params).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error searching sponsors:',
            error
          );
          done();
        },
      });
    });
  });

  describe('retrieveSponsors', () => {
    const params = { sponsorName: 'Test', chapterId: 'CH01' };

    it('should POST to retrieve endpoint and return sponsor array', (done) => {
      const sponsors = [
        { sponsorId: 'S001', name: 'Sponsor A' },
        { sponsorId: 'S002', name: 'Sponsor B' },
      ];
      apiService.post.and.returnValue(of({ data: sponsors }));

      service.retrieveSponsors(params).subscribe((result) => {
        expect(result).toEqual(sponsors as any);
        done();
      });
    });

    it('should return empty array when response data is missing', (done) => {
      apiService.post.and.returnValue(of({} as any));

      service.retrieveSponsors(params).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 400, message: 'Bad request' };
      apiService.post.and.returnValue(throwError(() => error));

      service.retrieveSponsors(params).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error retrieving sponsor details:',
            error
          );
          done();
        },
      });
    });
  });

  describe('getSponsorDrives', () => {
    it('should GET drives endpoint with sponsorId', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getSponsorDrives('S001').subscribe(() => {
        const endpoint = apiService.get.calls.mostRecent().args[0];
        expect(endpoint).toContain('/drives/S001');
        done();
      });
    });

    it('should return mapped drive data', (done) => {
      const drives = [
        { driveId: 'D1', driveDate: '2025-01-15', driveType: 'M', status: 'Active' },
      ];
      apiService.get.and.returnValue(of({ data: drives }));

      service.getSponsorDrives('S001').subscribe((result) => {
        expect(result).toEqual(drives as any);
        done();
      });
    });

    it('should return empty array when response data is null', (done) => {
      apiService.get.and.returnValue(of({ data: null }));

      service.getSponsorDrives('S001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 404 };
      apiService.get.and.returnValue(throwError(() => error));

      service.getSponsorDrives('NOTFOUND').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching sponsor drives:',
            error
          );
          done();
        },
      });
    });
  });

  describe('mergeSponsors', () => {
    const request = { fromSponsorId: 'S001', toSponsorId: 'S002' };

    it('should POST merge request and return raw result', (done) => {
      const response = { success: true, message: 'Merged successfully' };
      apiService.post.and.returnValue(of(response));

      service.mergeSponsors(request).subscribe((result) => {
        expect(result).toEqual(response as any);
        const callArgs = apiService.post.calls.mostRecent().args;
        expect(callArgs[0]).toContain('/merge');
        expect(callArgs[1]).toBe(request);
        done();
      });
    });

    it('should not transform the response (no map operator)', (done) => {
      const response = {
        success: true,
        message: 'OK',
        data: [{ fromSponsorId: 'S001', toSponsorId: 'S002', merged: true }],
        item: { fromSponsorId: 'S001', toSponsorId: 'S002', merged: true },
      };
      apiService.post.and.returnValue(of(response));

      service.mergeSponsors(request).subscribe((result) => {
        expect(result).toBe(response as any);
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 500, message: 'Internal server error' };
      apiService.post.and.returnValue(throwError(() => error));

      service.mergeSponsors(request).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error merging sponsors:',
            error
          );
          done();
        },
      });
    });
  });
});
