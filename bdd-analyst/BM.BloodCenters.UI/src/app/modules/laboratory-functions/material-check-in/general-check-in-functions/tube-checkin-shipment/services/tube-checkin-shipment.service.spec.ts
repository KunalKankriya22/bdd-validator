import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TubeCheckinShipmentService } from './tube-checkin-shipment.service';
import { environment } from '../../../../../../../environments/environment';
import {
  SamplePackDto,
  SamplePackTubeDto,
  ReturnResult,
} from '../models/tube-checkin-shipment.model';

describe('TubeCheckinShipmentService', () => {
  let service: TubeCheckinShipmentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/sample-packs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(TubeCheckinShipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should POST to correct URL and return result', (done) => {
      const query = { status: 'O' } as any;
      const mockResponse: ReturnResult<SamplePackDto> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ boxId: 'BOX1' } as SamplePackDto],
        totalRecords: 1,
      };

      service.getAll(10, 0, query).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should return fallback on error', (done) => {
      service.getAll(10, 0, {} as any).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      httpMock.expectOne(`${baseUrl}/10/0`).error(new ProgressEvent('error'));
    });
  });

  describe('getById', () => {
    it('should GET the correct URL and return data', (done) => {
      const mockPack = { boxId: 'BOX1' } as SamplePackDto;

      service.getById('BOX1').subscribe((result) => {
        expect(result).toEqual(mockPack);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/BOX1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPack);
    });

    it('should return null on error', (done) => {
      service.getById('BAD').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      httpMock.expectOne(`${baseUrl}/BAD`).error(new ProgressEvent('error'));
    });
  });

  describe('simple HTTP methods', () => {
    const cases: {
      name: string;
      call: (svc: TubeCheckinShipmentService) => any;
      expectedUrl: string;
      expectedMethod: string;
      expectedBody?: any;
    }[] = [
      {
        name: 'create POSTs to baseUrl',
        call: (svc) => svc.create({ boxId: 'B1' } as any),
        expectedUrl: `${baseUrl}`,
        expectedMethod: 'POST',
        expectedBody: { boxId: 'B1' },
      },
      {
        name: 'update PUTs to baseUrl/boxId',
        call: (svc) => svc.update('B1', { extractType: 'V' } as any),
        expectedUrl: `${baseUrl}/B1`,
        expectedMethod: 'PUT',
        expectedBody: { extractType: 'V' },
      },
      {
        name: 'close PUTs to baseUrl/boxId/close with empty body',
        call: (svc) => svc.close('B1'),
        expectedUrl: `${baseUrl}/B1/close`,
        expectedMethod: 'PUT',
        expectedBody: {},
      },
      {
        name: 'addTube POSTs to baseUrl/boxId/tubes',
        call: (svc) => svc.addTube('B1', { unitId: 'U1' } as any),
        expectedUrl: `${baseUrl}/B1/tubes`,
        expectedMethod: 'POST',
        expectedBody: { unitId: 'U1' },
      },
      {
        name: 'removeTube DELETEs baseUrl/boxId/tubes/unitId',
        call: (svc) => svc.removeTube('B1', 'U1'),
        expectedUrl: `${baseUrl}/B1/tubes/U1`,
        expectedMethod: 'DELETE',
      },
    ];

    cases.forEach(({ name, call, expectedUrl, expectedMethod, expectedBody }) => {
      it(name, (done) => {
        const mockResponse = { success: true, message: '', statusCode: 200 };

        call(service).subscribe((result: any) => {
          expect(result).toEqual(mockResponse);
          done();
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe(expectedMethod);
        if (expectedBody !== undefined) {
          expect(req.request.body).toEqual(expectedBody);
        }
        req.flush(mockResponse);
      });
    });
  });

  describe('getTubes', () => {
    it('should GET tubes and return result', (done) => {
      const mockResponse: ReturnResult<SamplePackTubeDto> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ boxId: 'B1', unitId: 'U1' } as SamplePackTubeDto],
      };

      service.getTubes('B1').subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/B1/tubes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return fallback on error', (done) => {
      service.getTubes('B1').subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.data).toEqual([]);
        done();
      });

      httpMock.expectOne(`${baseUrl}/B1/tubes`).error(new ProgressEvent('error'));
    });
  });

  describe('getBoxUnits', () => {
    it('should map result.data from getTubes', (done) => {
      const tubes = [
        { boxId: 'B1', unitId: 'U1' } as SamplePackTubeDto,
        { boxId: 'B1', unitId: 'U2' } as SamplePackTubeDto,
      ];

      service.getBoxUnits('B1', 'CH1').subscribe((result) => {
        expect(result).toEqual(tubes);
        done();
      });

      httpMock.expectOne(`${baseUrl}/B1/tubes`).flush({
        success: true,
        message: '',
        statusCode: 200,
        data: tubes,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getBoxUnits('B1', 'CH1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      httpMock.expectOne(`${baseUrl}/B1/tubes`).flush({
        success: true,
        message: '',
        statusCode: 200,
        data: null,
      });
    });
  });

  describe('getOpenBoxesLookup', () => {
    it('should POST to lookups/open-boxes and map data', (done) => {
      const boxes = [{ boxId: 'B1' }, { boxId: 'B2' }] as SamplePackDto[];

      service.getOpenBoxesLookup().subscribe((result) => {
        expect(result).toEqual(boxes);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/open-boxes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, message: '', statusCode: 200, data: boxes });
    });

    it('should return empty array on error', (done) => {
      service.getOpenBoxesLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/open-boxes`).error(new ProgressEvent('error'));
    });
  });

  describe('getOpenBoxes', () => {
    it('should map open boxes to boxId strings', (done) => {
      service.getOpenBoxes('CH1').subscribe((result) => {
        expect(result).toEqual(['B1', 'B2']);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/open-boxes`).flush({
        success: true,
        message: '',
        statusCode: 200,
        data: [{ boxId: 'B1' }, { boxId: 'B2' }],
      });
    });
  });

  describe('getDestinationLabs', () => {
    it('should POST to lookups/testing-labs and map data', (done) => {
      const labs = [{ testingLabId: 'L1', testingLabName: 'Lab One' }] as any[];

      service.getDestinationLabs('CH1').subscribe((result) => {
        expect(result).toEqual(labs);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/testing-labs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, message: '', statusCode: 200, data: labs });
    });

    it('should return empty array on error', (done) => {
      service.getDestinationLabs('CH1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/testing-labs`).error(new ProgressEvent('error'));
    });
  });

  describe('getPlateCapacity', () => {
    it('should return plateCapacity from API', (done) => {
      service.getPlateCapacity().subscribe((result) => {
        expect(result).toBe(96);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/plate-capacity`).flush({
        success: true,
        data: { plateCapacity: 96 },
        statusCode: 200,
      });
    });

    it('should default to 88 when plateCapacity is null', (done) => {
      service.getPlateCapacity().subscribe((result) => {
        expect(result).toBe(88);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/plate-capacity`).flush({
        success: true,
        data: { plateCapacity: null },
        statusCode: 200,
      });
    });

    it('should return 88 on error', (done) => {
      service.getPlateCapacity().subscribe((result) => {
        expect(result).toBe(88);
        done();
      });

      httpMock.expectOne(`${baseUrl}/lookups/plate-capacity`).error(new ProgressEvent('error'));
    });
  });

  describe('viewUnitsInBox', () => {
    it('should compute unitCount and tubeCount correctly', (done) => {
      const tubes: SamplePackTubeDto[] = [
        { boxId: 'B1', unitId: 'U1' } as SamplePackTubeDto,
        { boxId: 'B1', unitId: 'U1' } as SamplePackTubeDto,
        { boxId: 'B1', unitId: 'U2' } as SamplePackTubeDto,
      ];

      service.viewUnitsInBox('B1', 'CH1').subscribe((result) => {
        expect(result.tubes).toEqual(tubes);
        expect(result.unitCount).toBe(2); // U1 and U2 (Set deduplication)
        expect(result.tubeCount).toBe(3); // 3 total tubes
        done();
      });

      httpMock.expectOne(`${baseUrl}/B1/tubes`).flush({
        success: true,
        message: '',
        statusCode: 200,
        data: tubes,
      });
    });

    it('should return zeros on error', (done) => {
      service.viewUnitsInBox('B1', 'CH1').subscribe((result) => {
        expect(result).toEqual({ tubes: [], unitCount: 0, tubeCount: 0 });
        done();
      });

      httpMock.expectOne(`${baseUrl}/B1/tubes`).error(new ProgressEvent('error'));
    });
  });
});
