import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { EnterTestObservationsTech1Service } from './enter-test-observations-tech1.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  SaveObservationsRequest,
  SaveNoteRequest,
  SaveOtherBandsRequest,
} from './enter-test-observations-tech1.model';

describe('EnterTestObservationsTech1Service', () => {
  let service: EnterTestObservationsTech1Service;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnterTestObservationsTech1Service],
    });

    service = TestBed.inject(EnterTestObservationsTech1Service);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = `${environment.apiUrl}${API.TESTING_MODULES.ENTER_TEST_OBSERVATIONS_TECH1.BASE}`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadInitialOptions', () => {
    it('should map test batches correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { tbId: 'TB-001', testId: 'TEST1' },
          { tbId: 'TB-002', testId: 'TEST2' },
        ],
      };

      service.loadInitialOptions().subscribe((result) => {
        expect(result.testBatchWorksheets.length).toBe(2);
        expect(result.testBatchWorksheets[0].id).toBe('TB-001');
        expect(result.testBatchWorksheets[0].displayName).toBe('TB-001');
        expect(result.testBatchWorksheets[0].description).toBe('');
        expect(result.testBatchWorksheets[1].id).toBe('TB-002');
        expect(result.testIds).toEqual([]);
        expect(result.testTypes).toEqual([]);
        expect(result.resultInterpretations).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/test-batches`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadInitialOptions().subscribe((result) => {
        expect(result.testBatchWorksheets).toEqual([]);
        expect(result.testIds).toEqual([]);
        expect(result.testTypes).toEqual([]);
        expect(result.resultInterpretations).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/test-batches`);
      req.flush(mockResponse);
    });
  });

  describe('loadTestsForBatch', () => {
    it('should map tests correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { testId: 'ABORH', testDesc: 'ABO/RH Typing' },
          { testId: 'HBSAG', testDesc: 'Hepatitis B Surface Antigen' },
        ],
      };

      service.loadTestsForBatch('TB-001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ id: 'ABORH', code: 'ABORH', description: 'ABO/RH Typing' });
        expect(result[1]).toEqual({ id: 'HBSAG', code: 'HBSAG', description: 'Hepatitis B Surface Antigen' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/tests/TB-001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode tbId in URL', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadTestsForBatch('TB/001 special').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/tests/${encodeURIComponent('TB/001 special')}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadTestsForBatch('TB-001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/tests/TB-001`);
      req.flush(mockResponse);
    });
  });

  describe('loadResultCodes', () => {
    it('should map result codes correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { resultCode: 'POS', resultDesc: 'Positive' },
          { resultCode: 'NEG', resultDesc: 'Negative' },
        ],
      };

      service.loadResultCodes('ABORH').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'POS', description: 'Positive' });
        expect(result[1]).toEqual({ code: 'NEG', description: 'Negative' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/result-codes/ABORH`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadResultCodes('ABORH').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/result-codes/ABORH`);
      req.flush(mockResponse);
    });
  });

  describe('loadBandValues', () => {
    it('should map band values correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { result: '1+', resultDesc: 'Weak Positive' },
          { result: '4+', resultDesc: 'Strong Positive' },
        ],
      };

      service.loadBandValues('ABORH').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ result: '1+', resultDesc: 'Weak Positive' });
        expect(result[1]).toEqual({ result: '4+', resultDesc: 'Strong Positive' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/band-values/ABORH`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadBandValues('ABORH').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/band-values/ABORH`);
      req.flush(mockResponse);
    });
  });

  describe('loadTestTypes', () => {
    it('should map test types with controlValue', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { testType: 'TUBE', testTypeDesc: 'Tube Testing', controlValue: 'Y' },
          { testType: 'GEL', testTypeDesc: 'Gel Testing', controlValue: 'N' },
        ],
      };

      service.loadTestTypes('ABORH').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ id: 'TUBE', code: 'TUBE', description: 'Tube Testing', controlValue: 'Y' });
        expect(result[1]).toEqual({ id: 'GEL', code: 'GEL', description: 'Gel Testing', controlValue: 'N' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/test-types/ABORH`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadTestTypes('ABORH').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/lov/test-types/ABORH`);
      req.flush(mockResponse);
    });
  });

  describe('loadObservationData', () => {
    it('should build columns from first unit bandResults', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: 'POS',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '4+' },
              { bandName: 'Anti-B', bandSeq: 2, tech1BandVal: '0' },
            ],
            otherBands: [],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        expect(result.columns.length).toBe(2);
        expect(result.columns[0]).toEqual({ columnId: 'Anti-A', columnName: 'Anti-A', order: 1 });
        expect(result.columns[1]).toEqual({ columnId: 'Anti-B', columnName: 'Anti-B', order: 2 });
        expect(result.description).toBe('TB-001');
        expect(result.testTypeDescription).toBe('TUBE');
        expect(result.controlValue).toBe('2');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map units with band observations correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: 'POS',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '4+' },
              { bandName: 'Anti-B', bandSeq: 2, tech1BandVal: '0' },
            ],
            otherBands: [],
          },
          {
            unitId: 'UNIT-002',
            collDate: '2024-01-16',
            tbSeqNo: 2,
            tempResult1: '',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '2+' },
              { bandName: 'Anti-B', bandSeq: 2, tech1BandVal: '3+' },
            ],
            otherBands: [],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        expect(result.units.length).toBe(2);

        const unit1 = result.units[0];
        expect(unit1.unitId).toBe('UNIT-001');
        expect(unit1.collDate).toBe('2024-01-15');
        expect(unit1.tbSeqNo).toBe(1);
        expect(unit1.tempResult1).toBe('POS');
        expect(unit1.bandSeqMap).toEqual({ 'Anti-A': 1, 'Anti-B': 2 });
        expect(unit1.bands.length).toBe(1);
        expect(unit1.bands[0].bandId).toBe('tech1');
        expect(unit1.bands[0].bandName).toBe('Tech 1');
        expect(unit1.bands[0].unitId).toBe('UNIT-001');
        expect(unit1.bands[0].observations).toEqual({ 'Anti-A': '4+', 'Anti-B': '0' });
        expect(unit1.bands[0].isOtherBand).toBe(false);

        const unit2 = result.units[1];
        expect(unit2.unitId).toBe('UNIT-002');
        expect(unit2.bands[0].observations).toEqual({ 'Anti-A': '2+', 'Anti-B': '3+' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should process otherBands with band1 and band2', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '4+' },
            ],
            otherBands: [
              { band1: 'Rh Control', band2: 'Anti-D' },
            ],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        const unit = result.units[0];
        expect(unit.bands.length).toBe(3);

        // Tech 1 band
        expect(unit.bands[0].bandId).toBe('tech1');
        expect(unit.bands[0].isOtherBand).toBe(false);

        // Other band1
        expect(unit.bands[1].bandId).toBe('other-band1-0');
        expect(unit.bands[1].bandName).toBe('Rh Control');
        expect(unit.bands[1].isOtherBand).toBe(true);
        expect(unit.bands[1].observations).toEqual({ 'Anti-A': null });

        // Other band2
        expect(unit.bands[2].bandId).toBe('other-band2-0');
        expect(unit.bands[2].bandName).toBe('Anti-D');
        expect(unit.bands[2].isOtherBand).toBe(true);
        expect(unit.bands[2].observations).toEqual({ 'Anti-A': null });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should handle otherBands with only band1', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '4+' },
            ],
            otherBands: [
              { band1: 'Rh Control' },
            ],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        const unit = result.units[0];
        expect(unit.bands.length).toBe(2);
        expect(unit.bands[1].bandId).toBe('other-band1-0');
        expect(unit.bands[1].bandName).toBe('Rh Control');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should return empty columns and units when holdingTests is empty', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        expect(result.columns).toEqual([]);
        expect(result.units).toEqual([]);
        expect(result.description).toBe('TB-001');
        expect(result.testTypeDescription).toBe('TUBE');
        expect(result.controlValue).toBe('2');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should return empty columns and units when data is null', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        expect(result.columns).toEqual([]);
        expect(result.units).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should use bandSeq for column order and fall back to index', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bandResults: [
              { bandName: 'Anti-A', tech1BandVal: '4+' },
              { bandName: 'Anti-B', bandSeq: 5, tech1BandVal: '0' },
            ],
            otherBands: [],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        // First band has no bandSeq, should fall back to index + 1 = 1
        expect(result.columns[0].order).toBe(1);
        // Second band has bandSeq = 5
        expect(result.columns[1].order).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should handle null tech1BandVal', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bandResults: [
              { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: null },
            ],
            otherBands: [],
          },
        ],
      };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE').subscribe((result) => {
        expect(result.units[0].bands[0].observations['Anti-A']).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/holding-tests/TB-001/ABORH?testType=TUBE`);
      req.flush(mockResponse);
    });

    it('should encode testType query parameter', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadObservationData('TB-001', 'ABORH', 'TUBE GEL').subscribe((result) => {
        expect(result.columns).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/holding-tests/TB-001/ABORH?testType=${encodeURIComponent('TUBE GEL')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('saveObservations', () => {
    it('should transform request correctly and POST to save endpoint', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        overrideCodes: ['OVR1'],
        unitObservations: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: 'POS',
            bandSeqMap: { 'Anti-A': 1, 'Anti-B': 2 },
            bands: [
              {
                bandId: 'tech1',
                bandName: 'Tech 1',
                unitId: 'UNIT-001',
                observations: { 'Anti-A': '4+', 'Anti-B': '0' },
                isOtherBand: false,
              },
            ],
          },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');

      const body = req.request.body;
      expect(body.tbId).toBe('TB-001');
      expect(body.testId).toBe('ABORH');
      expect(body.testType).toBe('TUBE');
      expect(body.overrideCodes).toEqual(['OVR1']);
      expect(body.observations.length).toBe(1);
      expect(body.observations[0].unitId).toBe('UNIT-001');
      expect(body.observations[0].collDate).toBe('2024-01-15');
      expect(body.observations[0].tbSeqNo).toBe(1);
      expect(body.observations[0].tempResult1).toBe('POS');
      expect(body.observations[0].bandResults).toEqual([
        { bandName: 'Anti-A', bandSeq: 1, tech1BandVal: '4+' },
        { bandName: 'Anti-B', bandSeq: 2, tech1BandVal: '0' },
      ]);

      req.flush(mockResponse);
    });

    it('should use fallback collDate when not provided', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        unitObservations: [
          {
            unitId: 'UNIT-001',
            bands: [
              {
                bandId: 'tech1',
                bandName: 'Tech 1',
                unitId: 'UNIT-001',
                observations: { 'Anti-A': '4+' },
              },
            ],
          },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      // collDate should be an ISO string fallback (new Date().toISOString())
      expect(body.observations[0].collDate).toBeTruthy();
      expect(typeof body.observations[0].collDate).toBe('string');
      // tbSeqNo should default to 0
      expect(body.observations[0].tbSeqNo).toBe(0);
      // tempResult1 should default to ''
      expect(body.observations[0].tempResult1).toBe('');
      req.flush(mockResponse);
    });

    it('should convert null observation values to null tech1BandVal', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        unitObservations: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bands: [
              {
                bandId: 'tech1',
                bandName: 'Tech 1',
                unitId: 'UNIT-001',
                observations: { 'Anti-A': null },
              },
            ],
          },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.body.observations[0].bandResults[0].tech1BandVal).toBeNull();
      req.flush(mockResponse);
    });

    it('should handle unit with no bands', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        unitObservations: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bands: [],
          },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.body.observations[0].bandResults).toEqual([]);
      req.flush(mockResponse);
    });

    it('should default bandSeq to 0 when bandSeqMap is missing', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        unitObservations: [
          {
            unitId: 'UNIT-001',
            collDate: '2024-01-15',
            tbSeqNo: 1,
            tempResult1: '',
            bands: [
              {
                bandId: 'tech1',
                bandName: 'Tech 1',
                unitId: 'UNIT-001',
                observations: { 'Anti-A': '4+' },
              },
            ],
          },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.body.observations[0].bandResults[0].bandSeq).toBe(0);
      req.flush(mockResponse);
    });

    it('should default overrideCodes to empty array when not provided', (done) => {
      const request: SaveObservationsRequest = {
        testBatchWorksheetId: 'TB-001',
        testId: 'ABORH',
        testTypeId: 'TUBE',
        unitObservations: [],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveObservations(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.body.overrideCodes).toEqual([]);
      req.flush(mockResponse);
    });
  });

  describe('loadNote', () => {
    it('should return first data item when data is non-empty array', (done) => {
      const mockNote = {
        noteId: 42,
        note: 'Sample observation note',
        insertUser: 'JDOE',
        insertDate: '2024-01-15T10:30:00Z',
      };
      const mockResponse = { success: true, data: [mockNote] };

      service.loadNote('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toEqual(mockNote);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/TB-001/ABORH/UNIT-001/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty array', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadNote('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/TB-001/ABORH/UNIT-001/1`);
      req.flush(mockResponse);
    });

    it('should return null when data is not an array', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadNote('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/TB-001/ABORH/UNIT-001/1`);
      req.flush(mockResponse);
    });

    it('should encode URL parameters', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadNote('TB/001', 'AB ORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/notes/${encodeURIComponent('TB/001')}/${encodeURIComponent('AB ORH')}/UNIT-001/1`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('saveNote', () => {
    it('should POST note request to notes endpoint', (done) => {
      const request: SaveNoteRequest = {
        tbId: 'TB-001',
        testId: 'ABORH',
        unitId: 'UNIT-001',
        tbSeqNo: 1,
        noteId: null,
        note: 'New observation note',
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveNote(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteNote', () => {
    it('should DELETE to notes endpoint with noteId', (done) => {
      const mockResponse = { success: true, message: 'Deleted', statusCode: 200, data: null };

      service.deleteNote('42').subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should encode noteId in URL', (done) => {
      const mockResponse = { success: true, message: 'Deleted', statusCode: 200, data: null };

      service.deleteNote('note/42').subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/${encodeURIComponent('note/42')}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('loadOtherBands', () => {
    it('should return data array when response data is an array', (done) => {
      const mockData = [
        { band1: 'Rh Control', band2: 'Anti-D', tech: 'JDOE' },
      ];
      const mockResponse = { success: true, data: mockData };

      service.loadOtherBands('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toEqual(mockData);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands/TB-001/ABORH/UNIT-001/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is not an array', (done) => {
      const mockResponse = { success: true, data: null };

      service.loadOtherBands('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands/TB-001/ABORH/UNIT-001/1`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is an object instead of array', (done) => {
      const mockResponse = { success: true, data: { band1: 'test' } };

      service.loadOtherBands('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands/TB-001/ABORH/UNIT-001/1`);
      req.flush(mockResponse);
    });

    it('should encode URL parameters', (done) => {
      const mockResponse = { success: true, data: [] };

      service.loadOtherBands('TB/001', 'AB ORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/other-bands/${encodeURIComponent('TB/001')}/${encodeURIComponent('AB ORH')}/UNIT-001/1`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('saveOtherBands', () => {
    it('should POST other bands request', (done) => {
      const request: SaveOtherBandsRequest = {
        tbId: 'TB-001',
        testId: 'ABORH',
        unitId: 'UNIT-001',
        tbSeqNo: 1,
        otherBands: [
          { band1: 'Rh Control', band2: 'Anti-D', tech: 'JDOE' },
        ],
      };

      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: null };

      service.saveOtherBands(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteOtherBands', () => {
    it('should DELETE to other-bands endpoint with path params', (done) => {
      const mockResponse = { success: true, message: 'Deleted', statusCode: 200, data: null };

      service.deleteOtherBands('TB-001', 'ABORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands/TB-001/ABORH/UNIT-001/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should encode URL parameters', (done) => {
      const mockResponse = { success: true, message: 'Deleted', statusCode: 200, data: null };

      service.deleteOtherBands('TB/001', 'AB ORH', 'UNIT-001', '1').subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/other-bands/${encodeURIComponent('TB/001')}/${encodeURIComponent('AB ORH')}/UNIT-001/1`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
