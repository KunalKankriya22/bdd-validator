import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DonorFunctionsService, Donor } from './donor-functions.service';
import { ApiService } from '../../../shared/services/api.service';

describe('DonorFunctionsService', () => {
  let service: DonorFunctionsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DonorFunctionsService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(DonorFunctionsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDonors', () => {
    it('should return all donors', (done) => {
      const mockDonors: Donor[] = [
        { firstName: 'John', lastName: 'Doe', bloodType: 'O+' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockDonors));

      service.getDonors().subscribe(result => {
        expect(result).toEqual(mockDonors);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('donors');
        done();
      });
    });
  });

  describe('getDonorById', () => {
    it('should return a single donor by id', (done) => {
      const mockDonor: Donor = { id: 'D001', firstName: 'Jane', lastName: 'Doe' };
      apiServiceSpy.get.and.returnValue(of(mockDonor));

      service.getDonorById('D001').subscribe(result => {
        expect(result).toEqual(mockDonor);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('donors/D001');
        done();
      });
    });
  });

  describe('createDonor', () => {
    it('should post a new donor', (done) => {
      const newDonor: Donor = { firstName: 'New', lastName: 'Donor' };
      apiServiceSpy.post.and.returnValue(of(newDonor));

      service.createDonor(newDonor).subscribe(result => {
        expect(result).toEqual(newDonor);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('donors', newDonor);
        done();
      });
    });
  });

  describe('updateDonor', () => {
    it('should put updated donor data', (done) => {
      const updated: Donor = { firstName: 'Updated', lastName: 'Donor' };
      apiServiceSpy.put.and.returnValue(of(updated));

      service.updateDonor('D001', updated).subscribe(result => {
        expect(result).toEqual(updated);
        expect(apiServiceSpy.put).toHaveBeenCalledWith('donors/D001', updated);
        done();
      });
    });
  });

  describe('deleteDonor', () => {
    it('should delete donor by id', (done) => {
      apiServiceSpy.delete.and.returnValue(of(void 0));

      service.deleteDonor('D001').subscribe(() => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('donors/D001');
        done();
      });
    });
  });

  describe('searchDonors', () => {
    it('should search donors by term', (done) => {
      const mockResults: Donor[] = [
        { firstName: 'John', lastName: 'Doe' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockResults));

      service.searchDonors('John').subscribe(result => {
        expect(result).toEqual(mockResults);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('donors/search?q=John');
        done();
      });
    });
  });
});
