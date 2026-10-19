import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DetachDonorFromDonationService } from './detach-donor-from-donation.service';
import { ApiService } from '@shared/services/api.service';

describe('DetachDonorFromDonationService', () => {
  let service: DetachDonorFromDonationService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        DetachDonorFromDonationService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DetachDonorFromDonationService);
  });

  [
    { name: 'getDonationsByUnitId', verb: 'get', args: ['U1'] },
    { name: 'validateDonation', verb: 'get', args: ['U1', '2024-01-01'] },
    { name: 'getBleedTimeDetails', verb: 'get', args: ['U1'] },
    { name: 'detachDonor', verb: 'post', args: [{ unitId: 'U1' }] },
  ].forEach(({ name, verb, args }) => {
    it(`${name} should delegate to apiService.${verb}`, (done) => {
      (apiSpy as any)[verb].and.returnValue(of({ success: true, data: [] }));

      (service as any)[name](...args).subscribe(() => {
        expect((apiSpy as any)[verb]).toHaveBeenCalled();
        done();
      });
    });
  });
});
