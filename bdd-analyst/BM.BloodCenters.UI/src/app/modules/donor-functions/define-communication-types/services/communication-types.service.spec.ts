import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommunicationTypesService } from './communication-types.service';
import { ApiService } from '../../../../shared/services/api.service';

describe('CommunicationTypesService', () => {
  let service: CommunicationTypesService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CommunicationTypesService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(CommunicationTypesService);
  });

  describe('search', () => {
    it('should POST payload and return mapped data and totalCount', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ commType: 'LTR', commCode: 'C1', description: 'Letter' }],
        totalCount: 1,
        success: true,
        message: '',
        statusCode: 200,
      };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.search('LTR', 10, 0, { searchKeyword: 'test' }).subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        const callArgs = apiSpy.post.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/communication-types/10/0');
        expect(callArgs[1].commType).toBe('LTR');
        done();
      });
    });

    it('should default to empty data and zero totalCount when response is null', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ data: null, totalCount: null, success: true, message: '', statusCode: 200 }));

      // Act
      service.search('LTR').subscribe((result) => {
        // Assert
        expect(result).toEqual({ data: [], totalCount: 0 });
        done();
      });
    });
  });

  describe('create', () => {
    it('should POST and return raw response', (done) => {
      // Arrange
      const request = { commType: 'LTR', commCode: 'C1', description: 'Letter', effDate: '2024-01-01' };
      const mockResponse = { data: request, success: true, message: 'created', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.create(request as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post.calls.mostRecent().args[0]).toBe('/api/v1/communication-types');
        done();
      });
    });
  });

  describe('update', () => {
    it('should PUT with encoded URL segments and return raw response', (done) => {
      // Arrange
      const mockResponse = { data: {}, success: true, message: 'updated', statusCode: 200 };
      apiSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.update('LTR', 'C1', { description: 'Updated' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.put.calls.mostRecent().args[0]).toBe('/api/v1/communication-types/LTR/C1');
        done();
      });
    });
  });
});
