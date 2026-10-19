import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

// TODO: Remove this interceptor once MLT-14191 backend is deployed.
export function devTransferMockInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  if (req.url.includes('unit-transfer-to-transfusion/execute')) {
    const now = new Date().toISOString();
    return of(new HttpResponse({
      status: 200,
      body: {
        success: true,
        message: 'Transfer successful',
        error: null,
        statusCode: 200,
        data: { processStartTime: now, processEndTime: now },
      },
    }));
  }
  return next(req);
}
