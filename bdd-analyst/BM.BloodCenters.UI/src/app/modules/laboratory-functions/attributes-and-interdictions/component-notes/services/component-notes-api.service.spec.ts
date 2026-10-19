import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentNotesApiService } from './component-notes-api.service';
import { API } from '@core/constants/api.constants';
import { SaveNoteRequest } from '../models/component-notes.model';

describe('ComponentNotesApiService', () => {
  let service: ComponentNotesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComponentNotesApiService]
    });
    service = TestBed.inject(ComponentNotesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    const unitId = 'W1234567890123';
    const url = API.COMPONENT_NOTES.VALIDATE_UNIT(unitId);

    it('should return the first item from response data on success', () => {
      const mockData = {
        unitId: 'W1234567890123',
        collDate: '2026-01-15',
        isValid: true,
        hasComponents: true,
        componentCount: 3
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result).toEqual(mockData);
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', statusCode: 200, data: [mockData] });
    });

    it('should throw an error when success is false', () => {
      service.validateUnit(unitId).subscribe({
        next: () => fail('should have thrown'),
        error: (error) => {
          expect(error.message).toBe('Unit not found');
        }
      });

      const req = httpMock.expectOne(url);
      req.flush({
        success: false,
        message: 'Unit not found',
        statusCode: 404,
        data: []
      });
    });

    it('should extract errorCode from errorResponse', () => {
      service.validateUnit(unitId).subscribe({
        next: () => fail('should have thrown'),
        error: (error) => {
          expect(error.errorCode).toBe('0063');
          expect(error.message).toBe('Unit ID is required');
        }
      });

      const req = httpMock.expectOne(url);
      req.flush({
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        data: [],
        errorResponse: { errorCode: '0063', error: 'Unit ID is required' }
      });
    });

    it('should throw error when data array is empty', () => {
      service.validateUnit(unitId).subscribe({
        next: () => fail('should have thrown'),
        error: (error) => {
          expect(error.message).toBe('No data returned');
        }
      });

      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        message: 'No data returned',
        statusCode: 200,
        data: []
      });
    });
  });

  describe('getProducts', () => {
    const unitId = 'W1234567890123';
    const collDate = '2026-01-15';

    it('should return products on success', () => {
      const mockProducts = [
        { productCode: 'RBC', productDesc: 'Red Blood Cells' },
        { productCode: 'PLT', productDesc: 'Platelets' }
      ];

      service.getProducts(unitId, collDate).subscribe(result => {
        expect(result).toEqual(mockProducts);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === API.COMPONENT_NOTES.PRODUCTS(unitId) &&
        r.params.get('collDate') === collDate &&
        r.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockProducts });
    });

    it('should return empty array when success is false', () => {
      service.getProducts(unitId, collDate).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.PRODUCTS(unitId));
      req.flush({ success: false, data: null });
    });

    it('should return empty array when data is null', () => {
      service.getProducts(unitId, collDate).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.PRODUCTS(unitId));
      req.flush({ success: true, data: null });
    });

    it('should use custom codeScheme when provided', () => {
      service.getProducts(unitId, collDate, 'C').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === API.COMPONENT_NOTES.PRODUCTS(unitId) &&
        r.params.get('codeScheme') === 'C'
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getComponentPrefixes', () => {
    const unitId = 'W1234567890123';
    const collDate = '2026-01-15';
    const productCode = 'RBC';

    it('should return prefixes on success', () => {
      const mockPrefixes = [{ componentPrefix: '01' }, { componentPrefix: '02' }];

      service.getComponentPrefixes(unitId, collDate, productCode).subscribe(result => {
        expect(result).toEqual(mockPrefixes);
      });

      const req = httpMock.expectOne(r =>
        r.url === API.COMPONENT_NOTES.COMPONENT_PREFIXES &&
        r.params.get('unitId') === unitId &&
        r.params.get('collDate') === collDate &&
        r.params.get('productCode') === productCode
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockPrefixes });
    });

    it('should return empty array when success is false', () => {
      service.getComponentPrefixes(unitId, collDate, productCode).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.COMPONENT_PREFIXES);
      req.flush({ success: false, data: null });
    });

    it('should return empty array when data is null', () => {
      service.getComponentPrefixes(unitId, collDate, productCode).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.COMPONENT_PREFIXES);
      req.flush({ success: true, data: null });
    });
  });

  describe('getNote', () => {
    const unitId = 'W1234567890123';
    const collDate = '2026-01-15';
    const productCode = 'RBC';
    const componentPrefix = '01';

    it('should return note data on success', () => {
      const mockNote = {
        unitId,
        collDate,
        productCode,
        componentPrefix,
        noteId: 'N001',
        note: 'Test note content'
      };

      service.getNote(unitId, collDate, productCode, componentPrefix).subscribe(result => {
        expect(result).toEqual(mockNote);
      });

      const req = httpMock.expectOne(r =>
        r.url === API.COMPONENT_NOTES.NOTE &&
        r.params.get('unitId') === unitId &&
        r.params.get('componentPrefix') === componentPrefix
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockNote] });
    });

    it('should return null when success is false', () => {
      service.getNote(unitId, collDate, productCode, componentPrefix).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.NOTE);
      req.flush({ success: false, data: null });
    });

    it('should return null when data is empty', () => {
      service.getNote(unitId, collDate, productCode, componentPrefix).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(r => r.url === API.COMPONENT_NOTES.NOTE);
      req.flush({ success: true, data: [] });
    });

    it('should pass all query params correctly', () => {
      service.getNote(unitId, collDate, productCode, componentPrefix).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === API.COMPONENT_NOTES.NOTE &&
        r.params.get('unitId') === unitId &&
        r.params.get('collDate') === collDate &&
        r.params.get('productCode') === productCode &&
        r.params.get('componentPrefix') === componentPrefix
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('saveNote', () => {
    const request: SaveNoteRequest = {
      unitId: 'W1234567890123',
      collDate: '2026-01-15',
      productCode: 'RBC',
      componentPrefix: '01',
      note: 'New component note'
    };

    it('should return save response on success', () => {
      service.saveNote(request).subscribe(result => {
        expect(result.noteId).toBe('N001');
      });

      const req = httpMock.expectOne(API.COMPONENT_NOTES.NOTE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, message: 'Saved', data: [{ noteId: 'N001', message: 'Note saved successfully' }] });
    });

    it('should return default response when data is empty on success', () => {
      service.saveNote(request).subscribe(result => {
        expect(result.noteId).toBe('');
      });

      const req = httpMock.expectOne(API.COMPONENT_NOTES.NOTE);
      req.flush({ success: true, message: 'Saved', data: [] });
    });

    it('should throw error when success is false', () => {
      service.saveNote(request).subscribe({
        next: () => fail('should have thrown'),
        error: (error) => {
          expect(error.message).toBe('Failed to save note');
        }
      });

      const req = httpMock.expectOne(API.COMPONENT_NOTES.NOTE);
      req.flush({ success: false, message: 'Failed to save note', data: [] });
    });

    it('should extract errorCode from errorResponse on failure', () => {
      service.saveNote(request).subscribe({
        next: () => fail('should have thrown'),
        error: (error) => {
          expect(error.errorCode).toBe('0004');
          expect(error.message).toBe('Note exceeds max length');
        }
      });

      const req = httpMock.expectOne(API.COMPONENT_NOTES.NOTE);
      req.flush({
        success: false,
        message: 'Validation failed',
        data: [],
        errorResponse: { errorCode: '0004', error: 'Note exceeds max length' }
      });
    });

    it('should include message from response in result', () => {
      service.saveNote(request).subscribe(result => {
        expect(result.message).toBe('Component notes added');
      });

      const req = httpMock.expectOne(API.COMPONENT_NOTES.NOTE);
      req.flush({ success: true, message: 'Component notes added', data: [{ noteId: 'N001' }] });
    });
  });
});
