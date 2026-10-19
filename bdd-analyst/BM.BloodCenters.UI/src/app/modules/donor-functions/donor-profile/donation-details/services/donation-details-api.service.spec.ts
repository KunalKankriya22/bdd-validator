import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DonationDetailsApiService } from './donation-details-api.service';
import { ApiService } from '@shared/services/api.service';

describe('DonationDetailsApiService', () => {
  let service: DonationDetailsApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonationDetailsApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonationDetailsApiService);
  });

  it('should getDonationDetails via POST', (done) => {
    mockApiService.post.and.returnValue(of({ data: [] }));

    service.getDonationDetails('D1', 10, 0, {} as any).subscribe(result => {
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });

  it('should getDonorHeader via GET', (done) => {
    mockApiService.get.and.returnValue(of({ donorId: 'D1' }));

    service.getDonorHeader('D1').subscribe(result => {
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  ['getEquipSupply', 'getAttributes', 'getPhysicalComments'].forEach(method => {
    it(`should call ${method} with transactionId`, (done) => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      (service as any)[method]('TX1').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should getAuxDonations with donorId', (done) => {
    mockApiService.get.and.returnValue(of({ data: [] }));

    service.getAuxDonations('D1').subscribe(() => {
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should searchSponsors with searchText', (done) => {
    mockApiService.get.and.returnValue(of({ data: [] }));

    service.searchSponsors('test').subscribe(() => {
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should updateCreditSponsor via PUT', (done) => {
    mockApiService.put.and.returnValue(of({ data: true }));

    service.updateCreditSponsor('U1', '2024-01-01', 'SP1').subscribe(() => {
      expect(mockApiService.put).toHaveBeenCalled();
      done();
    });
  });

  it('should getAccess via GET', (done) => {
    mockApiService.get.and.returnValue(of({ data: {} }));

    service.getAccess().subscribe(() => {
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should getPhysicalFindingsWithDetails with optional collectionDate', (done) => {
    mockApiService.get.and.returnValue(of({ data: [] }));

    service.getPhysicalFindingsWithDetails('U1', '2024-01-01').subscribe(() => {
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });
});
