import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DeleteNonUnitTubesService } from './delete-non-unit-tubes.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { NonUnitTubeDto } from '../models/delete-non-unit-tubes.model';

describe('DeleteNonUnitTubesService', () => {
  let service: DeleteNonUnitTubesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockTubesResponse = {
    success: true,
    data: {
      tubes: [
        { unitId: 'W12342402705-Q', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T10:00:00', chkDigit: '-Q' },
        { unitId: 'W12342402705-D', chapterId: 'WAD', tubeCheckinDats: '2025-11-02T10:00:00', chkDigit: '-D' },
        { unitId: 'W12342402705-Y', chapterId: 'WAD', tubeCheckinDats: '2025-11-03T10:00:00', chkDigit: '-Y' },
      ] as NonUnitTubeDto[],
      totalCount: 3,
    },
    message: '',
    errorCode: null
  };

  const mockDeleteResponse = {
    success: true,
    message: 'Tubes deleted successfully',
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DeleteNonUnitTubesService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(DeleteNonUnitTubesService);
  });

  describe('getTubes', () => {
    it('should fetch tubes for date range', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockTubesResponse));

      const startDate = '2025-11-01';
      const endDate = '2025-11-30';

      service.getTubes(startDate, endDate).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(3);
          expect(result.totalCount).toBe(3);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DELETE_NON_UNIT_TUBES.GET_TUBES,
            { startDate, endDate }
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty response data', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        data: { tubes: [], totalCount: 0 },
        message: 'No tubes found',
        errorCode: '0161'
      }));

      service.getTubes('2025-11-01', '2025-11-30').subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalCount).toBe(0);
          expect(result.message).toBe('No tubes found');
          expect(result.errorCode).toBe('0161');
          done();
        },
        error: done.fail,
      });
    });


    it('should return message and errorCode with data', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockTubesResponse));

      const startDate = '2025-11-01';
      const endDate = '2025-11-30';

      service.getTubes(startDate, endDate).subscribe({
        next: (result) => {
          expect(result.message).toBeDefined();
          expect(result.errorCode).toBeDefined();
          expect(result.success).toBeTrue();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('deleteTubes', () => {
    it('should delete tubes successfully', (done) => {
      apiServiceSpy.delete.and.returnValue(of(mockDeleteResponse));

      const unitIds = ['W12342402705-Q', 'W12342402705-D'];

      service.deleteTubes(unitIds).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Tubes deleted successfully');
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.DELETE_NON_UNIT_TUBES.DELETE_TUBES,
            { body: { unitIds } }
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should send correct payload structure', (done) => {
      apiServiceSpy.delete.and.returnValue(of(mockDeleteResponse));

      const unitIds = ['W12342402705-Q', 'W12342402705-D', 'W12342402705-Y'];

      service.deleteTubes(unitIds).subscribe({
        next: () => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.DELETE_NON_UNIT_TUBES.DELETE_TUBES,
            jasmine.objectContaining({ body: jasmine.objectContaining({ unitIds }) })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle delete failure', (done) => {
      apiServiceSpy.delete.and.returnValue(
        of({ success: false, message: 'Delete failed' })
      );

      service.deleteTubes(['W12342402705-Q']).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toBe('Delete failed');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty unit IDs array', (done) => {
      apiServiceSpy.delete.and.returnValue(of(mockDeleteResponse));

      service.deleteTubes([]).subscribe({
        next: (result) => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.DELETE_NON_UNIT_TUBES.DELETE_TUBES,
            { body: { unitIds: [] } }
          );
          done();
        },
        error: done.fail,
      });
    });


    it('should handle response without message', (done) => {
      apiServiceSpy.delete.and.returnValue(of({ success: true }));

      service.deleteTubes(['W12342402705-Q']).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBeUndefined();
          done();
        },
        error: done.fail,
      });
    });
  });
});
