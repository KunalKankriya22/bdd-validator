import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OrderClassCodesService } from './order-class-codes.service';
import { ApiService } from '@shared/services/api.service';
import { OrderClassCodesDto, UpdateOrderClassCodesDto } from '../models/order-class-codes.model';

describe('OrderClassCodesService', () => {
  let service: OrderClassCodesService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrderClassCodesService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(OrderClassCodesService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOrderClassCodes', () => {
    it('should fetch order class codes with pagination', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            orderClass: 'AD',
            chapterId: 'DAL',
            description: 'After Processing',
            priority: 11,
            hours: 12,
            displayFlag: 'Y',
            effectiveDate: new Date('2026-12-04T00:00:00'),
            terminationDate: new Date('2026-12-18T11:11:49.570Z'),
            editable: true
          },
          {
            orderClass: 'ST',
            chapterId: 'DAL',
            description: 'Stat',
            priority: 1,
            hours: 2,
            displayFlag: 'Y',
            effectiveDate: new Date('2026-12-04T00:00:00'),
            terminationDate: null,
            editable: true
          }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getOrderClassCodes(25, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.data[0].orderClass).toBe('AD');
        expect(result.data[1].orderClass).toBe('ST');
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should handle pagination parameters correctly', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getOrderClassCodes(50, 100, {}).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        const endpoint = callArgs[0] as string;

        // Verify take and skip are in the URL path
        expect(endpoint).toContain('/50/100');
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });




  });

  describe('addOrderClassCode', () => {
    it('should add a new order class code', (done) => {
      const newOrderClass: OrderClassCodesDto = {
        orderClass: 'ST',
        chapterId: 'DAL',
        description: 'Stat',
        priority: 1,
        hours: 2,
        displayFlag: 'Y',
        effectiveDate: '2026-12-04',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Order Class ST added successfully'
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.addOrderClassCode(newOrderClass).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toContain('Order Class ST added successfully');
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

  });

  describe('updateOrderClassCode', () => {
    it('should update an existing order class code', (done) => {
      const updateData: UpdateOrderClassCodesDto = {
        orderClass: 'AD',
        chapterId: 'DAL',
        description: 'Updated Description',
        priority: 15,
        hours: 20,
        displayFlag: 'Y',
        effectiveDate: '2026-12-04',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Order Class AD updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateOrderClassCode(updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toContain('Order Class AD updated successfully');
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should include all required fields in update request', (done) => {
      const updateData: UpdateOrderClassCodesDto = {
        orderClass: 'AD',
        chapterId: 'DAL',
        description: 'Test',
        priority: 10,
        hours: 12,
        displayFlag: 'Y',
        effectiveDate: '2026-01-01',
        terminationDate: null
      };

      const mockResponse = { success: true, message: 'Updated' };
      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateOrderClassCode(updateData).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          jasmine.any(String),
          jasmine.objectContaining({
            orderClass: 'AD',
            chapterId: 'DAL',
            description: 'Test'
          })
        );
        done();
      });
    });
  });
});
