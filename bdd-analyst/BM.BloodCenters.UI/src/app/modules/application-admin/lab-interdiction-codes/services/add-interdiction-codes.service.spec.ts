import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AddInterdictionCodeService } from './add-interdiction-codes.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('AddInterdictionCodeService', () => {
  let service: AddInterdictionCodeService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AddInterdictionCodeService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AddInterdictionCodeService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('addInterdictionCode', () => {
    it('should POST a new interdiction code payload', (done) => {
      const payload = { code: 'IC01', description: 'Hold' } as any;
      const mockResponse = { success: true };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.addInterdictionCode(payload).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.LAB_INTERDICTION_CODES.POST,
          payload
        );
        done();
      });
    });
  });

  describe('updateInterdictionCode', () => {
    it('should PUT the payload with interCode appended to the URL', (done) => {
      const payload = { description: 'Updated Hold' } as any;
      const mockResponse = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateInterdictionCode('IC01', payload).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          `${API.LAB_INTERDICTION_CODES.PUT}/IC01`,
          payload
        );
        done();
      });
    });
  });
});
