import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EnterNoteForSpecialProcessingService } from './enter-note-for-special-processing.service';
import { API } from 'src/app/core/constants/api.constants';
import { environment } from 'src/environments/environment';
import type {
  SpecialProcessingApiResponse,
  ProcessCodeItem,
  ProductCodeItem,
  ProductCodesResponse,
  AliquotItem,
  SpecialProcessingNoteDto,
} from '../models/enter-note-for-special-processing.model';

describe('EnterNoteForSpecialProcessingService', () => {
  let service: EnterNoteForSpecialProcessingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnterNoteForSpecialProcessingService,
      ],
    });
    service = TestBed.inject(EnterNoteForSpecialProcessingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProcessCodes', () => {
    it('should return process codes from API', () => {
      const mockResponse: SpecialProcessingApiResponse<ProcessCodeItem> = {
        success: true,
        message: 'Successfully retrieved process codes',
        statusCode: 200,
        data: [
          { processCode: 'FROZ', description: 'Freezing' },
          { processCode: 'WASH', description: 'Washing' },
        ],
        total: 2,
      };

      service.getProcessCodes().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].processCode).toBe('FROZ');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_PROCESS_CODES}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getProductCodes', () => {
    it('should return full response with product codes and collection date', () => {
      const mockResponse: ProductCodesResponse = {
        success: true,
        message: 'Successfully retrieved product codes',
        statusCode: 200,
        item: { productCode: '', description: null, collectionDate: '2012-11-02T00:00:00' },
        data: [
          { productCode: 'E0316V00', description: 'RED BLOOD CELLS|AS1/500mL/refg' },
          { productCode: 'E0385V00', description: 'RED BLOOD CELLS|AS5/450mL/refg...' },
        ],
        total: 2,
      };

      service.getProductCodes('FROZ', 'W123412110201').subscribe((result) => {
        expect(result.data?.length).toBe(2);
        expect(result.data?.[0].productCode).toBe('E0316V00');
        expect(result.item?.collectionDate).toBe('2012-11-02T00:00:00');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_PRODUCT_CODES('FROZ', 'W123412110201')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getAliquots', () => {
    it('should return aliquots for a process code, unit ID, and product code', () => {
      const mockResponse: SpecialProcessingApiResponse<AliquotItem> = {
        success: true,
        message: 'Successfully retrieved aliquots',
        statusCode: 200,
        data: [
          { aliquot: '00' },
          { aliquot: '01' },
        ],
        total: 2,
      };

      service.getAliquots('FROZ', 'W123412110201', 'E0385').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].aliquot).toBe('00');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_ALIQUOTS('FROZ', 'W123412110201', 'E0385')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('retrieve', () => {
    it('should post retrieve request and return response with item', () => {
      const mockResponse: SpecialProcessingApiResponse<SpecialProcessingNoteDto> = {
        success: true,
        message: 'Successfully retrieved component and note',
        statusCode: 200,
        item: {
          processCode: 'FROZ',
          processDescription: 'Freezing',
          unitId: 'W123412110201',
          collectionDate: '2012-11-02T00:00:00',
          chapterId: 'DAL',
          productCode: 'E0385V00',
          productDescription: 'RED BLOOD CELLS|AS5/450mL/refg...',
          componentPrefix: '00',
          aliquot: '00',
          noteId: 15406,
          noteText: 'Special Processing Notes',
        },
      };

      service.retrieve({
        processCode: 'FROZ',
        unitId: 'W123412110201',
        productCode: 'E0385V00',
        aliquot: '00',
      }).subscribe((result) => {
        expect(result.item?.processCode).toBe('FROZ');
        expect(result.item?.noteText).toBe('Special Processing Notes');
        expect(result.item?.noteId).toBe(15406);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.RETRIEVE}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.processCode).toBe('FROZ');
      expect(req.request.body.aliquot).toBe('00');
      req.flush(mockResponse);
    });

  });

  describe('save', () => {
    it('should post save request and return response', () => {
      const mockResponse: SpecialProcessingApiResponse<SpecialProcessingNoteDto> = {
        success: true,
        message: 'Note saved successfully',
        statusCode: 200,
        item: {
          processCode: 'FROZ',
          processDescription: 'Freezing',
          unitId: 'W123412110201',
          collectionDate: '2012-11-02T00:00:00',
          productCode: 'E0385V00',
          productDescription: 'RED BLOOD CELLS|AS5/450mL/refg...',
          noteId: 15406,
          noteText: 'Updated note',
        },
      };

      service.save({
        processCode: 'FROZ',
        unitId: 'W123412110201',
        productCode: 'E0385V00',
        aliquot: '00',
        noteText: 'Updated note',
      }).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.item?.noteText).toBe('Updated note');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.SAVE}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.noteText).toBe('Updated note');
      expect(req.request.body.aliquot).toBe('00');
      req.flush(mockResponse);
    });

  });
});
