import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import {
  DefineAccessClassService,
  CreateAccessClassRequest,
  UpdateAccessClassRequest
} from './define-access-class.service';
import { ChapterTimezoneService } from '../../../../shared/services/chapter-timezone.service';

describe('DefineAccessClassService', () => {
  let service: DefineAccessClassService;
  let httpMock: HttpTestingController;

  const chapterTimezoneStub = {
    convertGmtToLocal: jasmine.createSpy('convertGmtToLocal').and.callFake((m: any) => m),
    convertLocalToGmt: jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m),
    isChapterLocalDateAvailable: jasmine.createSpy('isChapterLocalDateAvailable').and.returnValue(false),
    chapterLocalDate: jasmine.createSpy('chapterLocalDate').and.returnValue(null)
  };

  beforeEach(() => {
    chapterTimezoneStub.convertGmtToLocal.calls.reset();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ChapterTimezoneService, useValue: chapterTimezoneStub }
      ]
    });

    service = TestBed.inject(DefineAccessClassService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map getDefineAccessClass response and normalize blank terminationDate', () => {
    const accessClass = '00ISU';

    service.getDefineAccessClass(accessClass, 'ASC').subscribe(rows => {
      expect(rows.length).toBe(1);
      expect(rows[0].class).toBe('00ISU');
      expect(rows[0].type).toBe('INTER');
      expect(rows[0].code).toBe('101A');
      expect(rows[0].description).toBe('A for Function 1.01');
      expect(rows[0].terminationDate).toBe('-');
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' && r.url.includes('/api/v1/define-access-class/00ISU') && r.urlWithParams.includes('sort=ASC')
    );

    req.flush({
      success: true,
      message: 'OK',
      statusCode: 200,
      data: [
        {
          class: '00ISU',
          classDescription: 'Information Services - Users',
          type: 'INTER',
          code: '101A',
          description: 'A for Function 1.01',
          effectiveDate: '2010-08-10T00:00:00',
          terminationDate: ' '
        }
      ]
    });
  });

  it('should map getTypesByClassname wrapped response', () => {
    service.getTypesByClassname('00ISU').subscribe(types => {
      expect(types).toEqual([{ type: 'INTER', description: '' }, { type: 'PROPR', description: '' }]);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' && r.url.includes('/api/v1/define-access-class/00ISU/types')
    );

    req.flush({
      success: true,
      statusCode: 200,
      data: [{ types: 'INTER' }, { types: 'PROPR' }]
    });
  });

  it('should map getTypesByClassname array response', () => {
    service.getTypesByClassname('00ISU').subscribe(types => {
      expect(types).toEqual([{ type: 'INTER', description: '' }, { type: 'SURVE', description: '' }]);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' && r.url.includes('/api/v1/define-access-class/00ISU/types')
    );

    req.flush([{ types: 'INTER' }, { types: 'SURVE' }]);
  });

  it('should map getCodeValuesByType wrapped response', () => {
    service.getCodeValuesByType('00ISU', 'INTER').subscribe(values => {
      expect(values.length).toBe(2);
      expect(values[0].value).toBe('101A');
      expect(values[1].value).toBe('101B');
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' && r.url.includes('/api/v1/define-access-class/00ISU/INTER/code-values')
    );

    req.flush({
      success: true,
      statusCode: 200,
      data: [{ value: '101A', description: 'Desc A' }, { value: '101B', description: 'Desc B' }]
    });
  });

  it('should map getCodeValuesByType array response', () => {
    service.getCodeValuesByType('00ISU', 'INTER').subscribe(values => {
      expect(values.length).toBe(2);
      expect(values[0].value).toBe('101A');
      expect(values[1].value).toBe('101C');
    });

    const req = httpMock.expectOne(r =>
      r.method === 'GET' && r.url.includes('/api/v1/define-access-class/00ISU/INTER/code-values')
    );

    req.flush([{ value: '101A', description: 'Desc A' }, { value: '101C', description: 'Desc C' }]);
  });

  it('should POST createAccessClass with request body', () => {
    const request: CreateAccessClassRequest = {
      accessCodeValues: ['101A', '101B'],
      accessClass: '00ISU',
      accessCodeType: 'INTER',
      effectiveDate: new Date().toISOString(),
      terminationDate: new Date().toISOString(),
      insertUser: 'USERID'
    };

    service.createAccessClass(request).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.statusCode).toBe(200);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url.includes('/api/v1/define-access-class')
    );

    expect(req.request.body).toEqual(request);

    req.flush({
      success: true,
      message: 'Created',
      statusCode: 200,
      item: []
    });
  });



  it('should PUT updateAccessClass with request body', () => {
    const request: UpdateAccessClassRequest = {
      accessClass: '00ISU',
      accessCodeType: 'INTER',
      accessCodeValue: '101A',
      terminationDate: new Date().toISOString()
    };

    service.updateAccessClass(request).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.statusCode).toBe(200);
    });

    const req = httpMock.expectOne(r =>
      r.method === 'PUT' && r.url.includes('/api/v1/define-access-class')
    );

    expect(req.request.body).toEqual(request);

    req.flush({
      success: true,
      message: 'Updated',
      statusCode: 200,
      item: {
        class: '00ISU',
        classDescription: '',
        type: 'INTER',
        code: '101A',
        description: 'A for Function 1.01',
        effectiveDate: '2010-08-10T00:00:00',
        terminationDate: new Date().toISOString()
      }
    });
  });
});
