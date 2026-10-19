import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ReturnReasonsService } from './return-reasons.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ReturnReasonsDto, UpdateReturnReasonsDto } from '../models/return-reasons.model';

describe('ReturnReasonsService', () => {
  let service: ReturnReasonsService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReturnReasonsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReturnReasonsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getReturnReasons', () => {
    it('should fetch return reasons with pagination', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'TEST1', codeDesc: 'Test Description 1' },
          { code: 'TEST2', codeDesc: 'Test Description 2' }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getReturnReasons(10, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

  });

  describe('getReturnReasonById', () => {
    it('should fetch a single return reason by ID', (done) => {
      const mockResponse = {
        success: true,
        item: { code: 'TEST1', codeDesc: 'Test Description', chapterId: 'CH1' }
      };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getReturnReasonById('CH1', 'TEST1').subscribe(result => {
        expect(result.item).toBeDefined();
        expect(result.item?.code).toBe('TEST1');
        expect(apiService.get).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getLocationTypes', () => {
    it('should fetch location types', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'DI', codeDesc: 'Discard' },
          { code: 'QU', codeDesc: 'Quarantine' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getLocationTypes().subscribe(result => {
        expect(result.data).toBeDefined();
        expect(result.data?.length).toBe(2);
        done();
      });
    });
  });

  describe('getChargeCodes', () => {
    it('should fetch charge codes', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'FEE1', codeDesc: 'Fee 1' },
          { code: 'FEE2', codeDesc: 'Fee 2' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getChargeCodes().subscribe(result => {
        expect(result.data).toBeDefined();
        expect(result.data?.length).toBe(2);
        done();
      });
    });
  });

  describe('addReturnReasons', () => {
    it('should add a new return reason', (done) => {
      const newReason: ReturnReasonsDto = {
        code: 'NEW1',
        codeDesc: 'New Reason',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: 'FEE1',
        feeCode2: 'FEE2',
        effDate: '15-Jan-2024',
        termDate: null,
        loggedInUserName: 'testuser',
        chapterId: 'CH1',
        warehouseId: 'WH1',
        warehouseName: 'Test Warehouse'
      };

      const mockResponse = {
        success: true,
        message: 'Return reason added successfully'
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.addReturnReasons(newReason).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateReturnReasons', () => {
    it('should update an existing return reason', (done) => {
      const updateData: UpdateReturnReasonsDto = {
        currentChapterId: 'CH1',
        currentCode: 'TEST1',
        codeDesc: 'Updated Description',
        locationType: 'DI',
        crNcr: 'Y',
        enforce: 'N',
        feeCode1: 'FEE1',
        feeCode2: 'FEE2',
        effDate: '15-Jan-2024',
        termDate: null,
       
        loggedInUserName: 'testuser',
        chapterId: 'CH1',
        warehouseId: 'WH1',
        warehouseName: 'Test Warehouse'
      };

      const mockResponse = {
        success: true,
        message: 'Return reason updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateReturnReasons(updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });
  });
});
