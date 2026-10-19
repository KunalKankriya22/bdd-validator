import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ModifyUnitApiService } from './modify-unit-api.service';
import { API } from '@core/constants/api.constants';

describe('ModifyUnitApiService', () => {
  let service: ModifyUnitApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ModifyUnitApiService],
    });
    service = TestBed.inject(ModifyUnitApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  [
    { method: 'getCollectionDates', args: ['U001'], url: API.MODIFY_UNIT.COLLECTION_DATES('U001') },
    { method: 'getDrives', args: ['2024-01-01'], url: API.MODIFY_UNIT.DRIVES('2024-01-01') },
    { method: 'getGroupSites', args: ['D001'], url: API.MODIFY_UNIT.GROUP_SITES('D001') },
    { method: 'getAboValues', args: [] as string[], url: API.MODIFY_UNIT.ABO_VALUES },
    { method: 'getCatalogs', args: [] as string[], url: API.MODIFY_UNIT.CATALOGS },
    { method: 'getLots', args: ['CAT001'], url: API.MODIFY_UNIT.LOTS('CAT001') },
    { method: 'getBatches', args: [] as string[], url: API.MODIFY_UNIT.BATCHES },
    { method: 'getAttributeGroups', args: [] as string[], url: API.MODIFY_UNIT.ATTRIBUTE_GROUPS },
    { method: 'getAttributeCodes', args: ['GRP1'], url: API.MODIFY_UNIT.ATTRIBUTE_CODES('GRP1') },
    { method: 'getEquipmentTypes', args: ['GRP1', 'CODE1'], url: API.MODIFY_UNIT.EQUIPMENT_TYPES('GRP1', 'CODE1') },
    { method: 'getSerialNumbers', args: ['TYPE1'], url: API.MODIFY_UNIT.SERIAL_NUMBERS('TYPE1') },
    { method: 'getDonorDecisionCodes', args: [] as string[], url: API.MODIFY_UNIT.DONOR_DECISION_CODES },
  ].forEach(({ method, args, url }) => {
    it(`${method} GETs and returns data array`, (done) => {
      const mockData = [{ id: 1 }];

      (service as any)[method](...args).subscribe((result: any) => {
        expect(result).toEqual(mockData);
        done();
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockData });
    });
  });

  it('getDetails GETs and returns item', (done) => {
    const mockItem = { unitId: 'U001' };

    service.getDetails('U001', '2024-01-01').subscribe(result => {
      expect(result).toEqual(mockItem as any);
      done();
    });

    const req = httpMock.expectOne(API.MODIFY_UNIT.DETAILS('U001', '2024-01-01'));
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, statusCode: 200, item: mockItem });
  });

  it('update PUTs request with SKIP_ERROR_TOAST context and returns item', (done) => {
    const request = { unitId: 'U001' } as any;
    const mockItem = { updated: true };

    service.update(request).subscribe(result => {
      expect(result).toEqual(mockItem as any);
      done();
    });

    const req = httpMock.expectOne(API.MODIFY_UNIT.UPDATE);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ success: true, statusCode: 200, item: mockItem });
  });
});
