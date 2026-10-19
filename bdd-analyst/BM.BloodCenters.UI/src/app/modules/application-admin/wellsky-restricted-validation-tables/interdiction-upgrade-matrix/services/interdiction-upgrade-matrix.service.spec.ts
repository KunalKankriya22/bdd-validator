import { TestBed } from '@angular/core/testing';
import { InterdictionUpgradeMatrixService } from './interdiction-upgrade-matrix.service';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { of, throwError } from 'rxjs';
import {
  InterdictionUpgradeMatrixModel,
  InterdictionUpgradeMatrixParamsDto,
  InterdictionUpgradeMatrixDto,
  UpdateInterdictionUpgradeMatrixDto,
  InterdictionUpgradeMatrixFilterLov
} from '../models/interdiction-upgrade-matrix.model';

describe('InterdictionUpgradeMatrixService', () => {
  let service: InterdictionUpgradeMatrixService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const mockMatrixData: InterdictionUpgradeMatrixModel[] = [
    {
      sourceInterdiction: 'SRC001',
      existingInterdiction: 'EXT001',
      actionInterdiction: 'ACT001',
      action: 'P',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    },
    {
      sourceInterdiction: 'SRC002',
      existingInterdiction: 'EXT002',
      actionInterdiction: 'ACT002',
      action: 'R',
      effectiveDate: new Date('2025-02-01'),
      terminationDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockMatrixData,
    total: 2
  };

  const mockFilterLov: InterdictionUpgradeMatrixFilterLov = {
    sourceInterdiction: ['SRC001', 'SRC002'],
    existingInterdiction: ['EXT001', 'EXT002'],
    actionInterdiction: ['ACT001', 'ACT002'],
    action: ['P', 'R']
  };

  const mockInterdictionCodes = {
    data: ['CODE001', 'CODE002', 'CODE003']
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testUser');

    TestBed.configureTestingModule({
      providers: [
        InterdictionUpgradeMatrixService,
        { provide: ApiService, useValue: mockApiService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });

    service = TestBed.inject(InterdictionUpgradeMatrixService);
  });

  describe('getInterdictionUpgradeMatrix', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: InterdictionUpgradeMatrixParamsDto = {};

      service.getInterdictionUpgradeMatrix(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/interdiction-upgrade-matrix\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('getInterdictionUpgradeMatrixFilters', () => {

    it('should return filter LOV data', (done) => {
      mockApiService.get.and.returnValue(of({ item: mockFilterLov }));

      service.getInterdictionUpgradeMatrixFilters().subscribe(result => {
        expect(result.item).toEqual(mockFilterLov);
        done();
      });
    });

  });

  describe('getInterdictionCodes', () => {

    it('should return interdiction codes data', (done) => {
      mockApiService.get.and.returnValue(of(mockInterdictionCodes));

      service.getInterdictionCodes().subscribe(result => {
        expect(result.data).toEqual(['CODE001', 'CODE002', 'CODE003']);
        done();
      });
    });

  });

  describe('addInterdictionUpgrade', () => {
    const mockAddData: InterdictionUpgradeMatrixDto = {
      sourceInterdiction: 'SRC001',
      existingInterdiction: 'EXT001',
      actionInterdiction: 'ACT001',
      action: 'P',
      effectiveDate: '2025-01-01',
      terminationDate: null
    };

    it('should call apiService.post with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Added successfully' }));

      service.addInterdictionUpgrade(mockAddData).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/interdiction-upgrade-matrix$/),
          mockAddData,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });

    it('should send loggedInUserName as query parameter', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      service.addInterdictionUpgrade(mockAddData).subscribe(() => {
        const calledArgs = mockApiService.post.calls.mostRecent().args;
        const options = calledArgs[2] as any;
        expect(options.params.get('loggedInUserName')).toBe('testUser');
        done();
      });
    });




    it('should send data with all fields', (done) => {
      const fullData: InterdictionUpgradeMatrixDto = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P',
        effectiveDate: '2025-01-01',
        terminationDate: '2025-12-31'
      };
      mockApiService.post.and.returnValue(of({ success: true }));

      service.addInterdictionUpgrade(fullData).subscribe(() => {
        const calledData = mockApiService.post.calls.mostRecent().args[1];
        expect(calledData).toEqual(fullData);
        done();
      });
    });
  });

  describe('updateInterdictionUpgrade', () => {
    const mockUpdateData: UpdateInterdictionUpgradeMatrixDto = {
      currentSourceInterdiction: 'SRC001',
      currentExistingInterdiction: 'EXT001',
      currentActionInterdiction: 'ACT001',
      existingInterdiction: 'EXT002',
      actionInterdiction: 'ACT002',
      action: 'R',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    };

    it('should call apiService.put with correct endpoint and data', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated successfully' }));

      service.updateInterdictionUpgrade(mockUpdateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/interdiction-upgrade-matrix$/),
          mockUpdateData
        );
        done();
      });
    });




    it('should send data with current and new values', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateInterdictionUpgrade(mockUpdateData).subscribe(() => {
        const calledData = mockApiService.put.calls.mostRecent().args[1];
        expect(calledData.currentSourceInterdiction).toBe('SRC001');
        expect(calledData.currentExistingInterdiction).toBe('EXT001');
        expect(calledData.currentActionInterdiction).toBe('ACT001');
        expect(calledData.existingInterdiction).toBe('EXT002');
        expect(calledData.actionInterdiction).toBe('ACT002');
        expect(calledData.action).toBe('R');
        done();
      });
    });

    it('should include effectiveDate in update payload as YYYY-MM-DD string', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateInterdictionUpgrade(mockUpdateData).subscribe(() => {
        const calledData = mockApiService.put.calls.mostRecent().args[1];
        expect(calledData.effectiveDate).toBe('2025-01-01');
        done();
      });
    });

  });

  describe('Error Handling', () => {
    it('should log error to console for getInterdictionUpgradeMatrix', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getInterdictionUpgradeMatrix(25, 0, {}).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching interdiction upgrade matrix data:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getInterdictionUpgradeMatrixFilters', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getInterdictionUpgradeMatrixFilters().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching interdiction upgrade matrix filters:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getInterdictionCodes', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getInterdictionCodes().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching interdiction codes:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for addInterdictionUpgrade', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const mockData: InterdictionUpgradeMatrixDto = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P',
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      service.addInterdictionUpgrade(mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error adding interdiction upgrade:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for updateInterdictionUpgrade', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      const mockData: UpdateInterdictionUpgradeMatrixDto = {
        currentSourceInterdiction: 'SRC001',
        currentExistingInterdiction: 'EXT001',
        currentActionInterdiction: 'ACT001',
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002',
        action: 'R',
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      service.updateInterdictionUpgrade(mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error updating interdiction upgrade:',
            error
          );
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getInterdictionUpgradeMatrix', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getInterdictionUpgradeMatrix(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

    it('should use correct HTTP method for each operation', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      mockApiService.get.and.returnValue(of({ data: [] }));
      mockApiService.put.and.returnValue(of({ success: true }));

      // Test POST for getInterdictionUpgradeMatrix
      service.getInterdictionUpgradeMatrix(25, 0, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();

        // Test GET for getInterdictionCodes
        service.getInterdictionCodes().subscribe(() => {
          expect(mockApiService.get).toHaveBeenCalled();

          // Test PUT for updateInterdictionUpgrade
          const updateData: UpdateInterdictionUpgradeMatrixDto = {
            currentSourceInterdiction: 'SRC001',
            currentExistingInterdiction: 'EXT001',
            currentActionInterdiction: 'ACT001',
            existingInterdiction: 'EXT002',
            actionInterdiction: 'ACT002',
            action: 'R',
            effectiveDate: '2025-01-01',
            terminationDate: null
          };

          service.updateInterdictionUpgrade(updateData).subscribe(() => {
            expect(mockApiService.put).toHaveBeenCalled();
            done();
          });
        });
      });
    });
  });
});
