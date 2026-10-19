import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MoveMenuItemService } from './move-menu-item.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import { MoveMenuItemRequest, MoveMenuItemResponse } from '../models/menu-item.model';

describe('MoveMenuItemService', () => {
  let service: MoveMenuItemService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['put']);

    TestBed.configureTestingModule({
      providers: [
        MoveMenuItemService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(MoveMenuItemService);
  });

  describe('moveMenuItem', () => {
    const mockFcnId = 123;
    const mockRequest: MoveMenuItemRequest = {
      targetParentMenuId: 456,
      targetSequence: 2
    };

    const mockResponse: MoveMenuItemResponse = {
      fcnId: 123,
      previousParentMenuId: 0,
      previousSequence: 1,
      newParentMenuId: 456,
      newSequence: 2,
      message: 'Menu item moved successfully'
    };

    it('should call apiService.put with correct endpoint and request', () => {
      mockApiService.put.and.returnValue(of(mockResponse));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith(
        API.SYSTEM_ADMIN.MENU_ADMIN.MOVE_MENU_ITEM(mockFcnId),
        mockRequest
      );
    });

    it('should return the response from API on success', (done) => {
      mockApiService.put.and.returnValue(of(mockResponse));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });
    });

    it('should log success message on successful move', (done) => {
      spyOn(console, 'log');
      mockApiService.put.and.returnValue(of(mockResponse));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe({
        next: () => {
          expect(console.log).toHaveBeenCalledWith(
            `Menu item ${mockFcnId} moved successfully:`,
            mockResponse
          );
          done();
        }
      });
    });

    it('should throw error on API failure', (done) => {
      const mockError = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => mockError));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should log error message on API failure', (done) => {
      spyOn(console, 'error');
      const mockError = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => mockError));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            `Error moving menu item ${mockFcnId}:`,
            mockError
          );
          done();
        }
      });
    });

    it('should handle moving to root (parentMenuId = 0)', () => {
      const rootRequest: MoveMenuItemRequest = {
        targetParentMenuId: 0,
        targetSequence: 1
      };

      mockApiService.put.and.returnValue(of({
        ...mockResponse,
        newParentMenuId: 0
      }));

      service.moveMenuItem(mockFcnId, rootRequest).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith(
        API.SYSTEM_ADMIN.MENU_ADMIN.MOVE_MENU_ITEM(mockFcnId),
        rootRequest
      );
    });

    it('should use correct API endpoint format', () => {
      mockApiService.put.and.returnValue(of(mockResponse));

      service.moveMenuItem(mockFcnId, mockRequest).subscribe();

      const expectedEndpoint = `/api/v1/groups/menu-items/${mockFcnId}/move`;
      expect(mockApiService.put).toHaveBeenCalledWith(
        expectedEndpoint,
        mockRequest
      );
    });
  });
});
