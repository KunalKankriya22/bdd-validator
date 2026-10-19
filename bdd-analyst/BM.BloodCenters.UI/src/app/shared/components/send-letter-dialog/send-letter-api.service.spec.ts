import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SendLetterApiService } from './send-letter-api.service';
import { ApiService } from '@shared/services/api.service';

describe('SendLetterApiService', () => {
  let service: SendLetterApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SendLetterApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SendLetterApiService);
  });

  describe('GET list methods', () => {
    const cases: { method: keyof SendLetterApiService; args: any[] }[] = [
      { method: 'getCommunicationTypes', args: [] },
      { method: 'getCommunicationCodes', args: ['TYPE1'] },
      { method: 'getLettersList', args: [] },
    ];

    cases.forEach(({ method, args }) => {
      it(`${method} should return mapped data array`, (done) => {
        const mockItems = [{ code: 'A' }];
        apiSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockItems, error: null, total: 1 }));

        (service[method] as Function)(...args).subscribe((result: any) => {
          expect(result).toEqual(mockItems);
          done();
        });
      });
    });
  });

  it('getLetterDetail should return first item from data', (done) => {
    const detail = { letterCode: 'L1' };
    apiSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [detail], error: null, total: 1 }));

    service.getLetterDetail('L1').subscribe((result) => {
      expect(result).toEqual(detail as any);
      done();
    });
  });

  describe('POST methods with success check', () => {
    const cases: { method: keyof SendLetterApiService; args: any[] }[] = [
      { method: 'generateLetter', args: [{ donorId: '1' }] },
      { method: 'saveLetter', args: [{ letterId: '1' }] },
    ];

    cases.forEach(({ method, args }) => {
      it(`${method} should return first data item on success`, (done) => {
        const item = { id: '1' };
        apiSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [item], error: null, total: 1 }));

        (service[method] as Function)(...args).subscribe((result: any) => {
          expect(result).toEqual(item);
          done();
        });
      });
    });
  });
});
