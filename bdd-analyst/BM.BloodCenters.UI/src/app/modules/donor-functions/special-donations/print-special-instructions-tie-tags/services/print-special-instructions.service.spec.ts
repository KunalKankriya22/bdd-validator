import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PrintSpecialInstructionsService } from './print-special-instructions.service';

describe('PrintSpecialInstructionsService', () => {
  let service: PrintSpecialInstructionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrintSpecialInstructionsService],
    });
    service = TestBed.inject(PrintSpecialInstructionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get donors', () => {
    const mockResponse = {
      data: [{ donorId: 'DN001', donorName: 'John Doe', displayValue: 'DN001 - John Doe' }],
    };

    service.getDonors().subscribe((donors) => {
      expect(donors.length).toBe(1);
      expect(donors[0].donorId).toBe('DN001');
    });

    const req = httpMock.expectOne('/api/v1/donors/print-special-inst-tie-tag/dropdown-values');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get tie tags for a donor', () => {
    const mockResponse = {
      data: [{ interdictionCode: 'A0001', tieTagText: 'Rare Donor', numberOfLabel: 1 }],
    };

    service.getTieTags('DN001').subscribe((tags) => {
      expect(tags.length).toBe(1);
      expect(tags[0].interdictionCode).toBe('A0001');
    });

    const req = httpMock.expectOne(
      '/api/v1/donors/print-special-inst-tie-tag/DN001',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get print instructions for a label code', () => {
    const mockResponse = {
      data: [{ sequence: 1, printInstruction: 'Draw 2 Red top tubes' }],
    };

    service.getPrintInstructions('SPINS001').subscribe((instructions) => {
      expect(instructions.length).toBe(1);
      expect(instructions[0].sequence).toBe(1);
    });

    const req = httpMock.expectOne(
      '/api/v1/donors/print-special-inst-tie-tag/view-print-instructions?labelCode=SPINS001',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get printers', () => {
    const mockResponse = {
      data: [{ code: 'P1', description: 'SGX420D - Tie Tag Printer' }],
    };

    service.getPrinters().subscribe((printers) => {
      expect(printers.length).toBe(1);
      expect(printers[0].code).toBe('P1');
    });

    const req = httpMock.expectOne('/api/v1/donors/print-special-inst-tie-tag/printers');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should print tie tags', () => {
    const request = { donorId: 'DN001', interdictionCode: 'A0001', numberOfLabels: 1, printer: 'P1' };
    const mockResponse = { data: null };

    service.printTieTags(request).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const req = httpMock.expectOne('/api/v1/donors/print-special-inst-tie-tag/print');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should return empty array when getDonors response has no data', () => {
    service.getDonors().subscribe((donors) => {
      expect(donors).toEqual([]);
    });

    const req = httpMock.expectOne('/api/v1/donors/print-special-inst-tie-tag/dropdown-values');
    req.flush({ data: null });
  });

  it('should get tie tags with interdiction code search', () => {
    const mockResponse = {
      data: [{ interdictionCode: 'A0001', tieTagText: 'Rare Donor', numberOfLabel: 1 }],
    };

    service.getTieTags('DN001', 'A0001').subscribe((tags) => {
      expect(tags.length).toBe(1);
      expect(tags[0].interdictionCode).toBe('A0001');
    });

    const req = httpMock.expectOne('/api/v1/donors/print-special-inst-tie-tag/DN001?interdictionCode=A0001');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
