import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LookupAndPrintDonorCardService } from './lookup-and-print-donor-card.service';
import { ApiService } from '@shared/services/api.service';

describe('LookupAndPrintDonorCardService', () => {
  let service: LookupAndPrintDonorCardService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        LookupAndPrintDonorCardService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(LookupAndPrintDonorCardService);
  });

  describe('getDonorDetails', () => {
    it('should return the donor details item', (done) => {
      // Arrange
      const mockItem = { donorId: 'D001' };
      apiSpy.get.and.returnValue(of({ item: mockItem }));

      // Act
      service.getDonorDetails('D001', 'DR01').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockItem as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getDonorPicture', () => {
    it('should return pictureBase64 or null', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ item: { pictureBase64: 'base64data' } }));

      // Act
      service.getDonorPicture('D001').subscribe((result) => {
        // Assert
        expect(result).toBe('base64data');
        done();
      });
    });
  });

  describe('getPrinters', () => {
    it('should return printer items array', (done) => {
      // Arrange
      const mockData = [{ printerId: 'P1' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getPrinters().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('printCard', () => {
    it('should post the print card request', (done) => {
      // Arrange
      const request = { donorId: 'D001' } as any;
      apiSpy.post.and.returnValue(of({ success: true }));

      // Act
      service.printCard(request).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getYtdLoss', () => {
    it('should return ytd loss item', (done) => {
      // Arrange
      const mockItem = { rbcLoss: 5, plasmaLoss: 3 };
      apiSpy.get.and.returnValue(of({ item: mockItem }));

      // Act
      service.getYtdLoss('D001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockItem);
        done();
      });
    });
  });

  describe('getNotes', () => {
    it('should return central notes array', (done) => {
      // Arrange
      const mockData = [{ noteId: 'N1', note: 'Test' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getNotes('D001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('addNote', () => {
    it('should post the note', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ success: true }));

      // Act
      service.addNote('D001', 'Test note').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getDonationTypesLov', () => {
    it('should return donation types array', (done) => {
      // Arrange
      const mockData = [{ donationType: 'WB' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getDonationTypesLov().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('getProcedureCodesLov', () => {
    it('should return procedure codes for a donation type', (done) => {
      // Arrange
      const mockData = [{ procedureCode: 'PC1' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getProcedureCodesLov('WB').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('getAlternateIdTypesLov', () => {
    it('should return alternate id types array', (done) => {
      // Arrange
      const mockData = [{ altIdType: 'SSN' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getAlternateIdTypesLov().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('getAllCitiesLov', () => {
    it('should return cities array', (done) => {
      // Arrange
      const mockData = [{ city: 'Portland' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getAllCitiesLov().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('getCityStateLov', () => {
    it('should return city-state items for given params', (done) => {
      // Arrange
      const mockData = [{ city: 'Portland', state: 'OR' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getCityStateLov({ city: 'Portland', state: 'OR', exact: true }).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('getSponsorsLov', () => {
    it('should return sponsors array', (done) => {
      // Arrange
      const mockData = [{ sponsorId: 'S1' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getSponsorsLov('test').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });

  describe('checkDonorEligibility', () => {
    it('should post eligibility request and return response', (done) => {
      // Arrange
      const request = { donorId: 'D001' } as any;
      const mockResponse = { eligible: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.checkDonorEligibility(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getEthnicGroupsLov', () => {
    it('should return ethnic groups array', (done) => {
      // Arrange
      const mockData = [{ ethnicGroup: 'EG1' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getEthnicGroupsLov().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });
  });
});
