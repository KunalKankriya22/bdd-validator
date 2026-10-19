import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { devTransferMockInterceptor } from './dev-transfer-mock.interceptor';

describe('devTransferMockInterceptor', () => {
  const mockNext = jasmine.createSpy('next').and.returnValue(
    of(new HttpResponse({ status: 200, body: { real: true } }))
  );

  beforeEach(() => {
    mockNext.calls.reset();
  });

  describe('URL matching', () => {
    it('should return mock response for unit-transfer-to-transfusion/execute URL', (done) => {
      const req = new HttpRequest('POST', 'http://api/unit-transfer-to-transfusion/execute', {});

      devTransferMockInterceptor(req, mockNext).subscribe((response) => {
        const httpResponse = response as HttpResponse<any>;
        expect(httpResponse.status).toBe(200);
        expect(httpResponse.body.success).toBe(true);
        expect(httpResponse.body.message).toBe('Transfer successful');
        expect(httpResponse.body.error).toBeNull();
        expect(httpResponse.body.statusCode).toBe(200);
        expect(httpResponse.body.data.processStartTime).toBeDefined();
        expect(httpResponse.body.data.processEndTime).toBeDefined();
        expect(mockNext).not.toHaveBeenCalled();
        done();
      });
    });

    it.each([
      'http://api/other-endpoint',
      'http://api/unit-transfer/list',
      'http://api/transfers',
    ])('should pass through non-matching URL: %s', (url, done: any) => {
      const req = new HttpRequest('GET', url);

      devTransferMockInterceptor(req, mockNext);

      expect(mockNext).toHaveBeenCalledWith(req);
      done();
    });
  });
});
