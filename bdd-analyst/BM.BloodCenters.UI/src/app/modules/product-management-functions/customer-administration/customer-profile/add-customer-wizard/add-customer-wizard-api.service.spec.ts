import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AddCustomerWizardApiService } from './add-customer-wizard-api.service';

describe('AddCustomerWizardApiService', () => {
  let service: AddCustomerWizardApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AddCustomerWizardApiService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(AddCustomerWizardApiService);
  });

  // -----------------------------------------------------------------------
  // createCustomerProfile
  // -----------------------------------------------------------------------
  describe('createCustomerProfile', () => {
    it('returns first element when response data is an array', (done) => {
      const profile = { customerId: 'C1' };
      httpSpy.post.and.returnValue(of({ data: [profile] }));

      service.createCustomerProfile({} as any).subscribe(result => {
        expect(result).toEqual(profile as any);
        done();
      });
    });

    it('returns data directly when response data is not an array', (done) => {
      const profile = { customerId: 'C1' };
      httpSpy.post.and.returnValue(of({ data: profile }));

      service.createCustomerProfile({} as any).subscribe(result => {
        expect(result).toEqual(profile as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateCustomerProfile
  // -----------------------------------------------------------------------
  describe('updateCustomerProfile', () => {
    it('returns first element when response data is an array', (done) => {
      const profile = { customerId: 'C1' };
      httpSpy.put.and.returnValue(of({ data: [profile] }));

      service.updateCustomerProfile('C1', {} as any).subscribe(result => {
        expect(result).toEqual(profile as any);
        done();
      });
    });

    it('returns data directly when response data is not an array', (done) => {
      const profile = { customerId: 'C1' };
      httpSpy.put.and.returnValue(of({ data: profile }));

      service.updateCustomerProfile('C1', {} as any).subscribe(result => {
        expect(result).toEqual(profile as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // generateCustomerId
  // -----------------------------------------------------------------------
  describe('generateCustomerId', () => {
    it('maps CustomerId to camelCase', (done) => {
      httpSpy.get.and.returnValue(of({ CustomerId: 'NEW1' }));

      service.generateCustomerId('HOS').subscribe(result => {
        expect(result).toEqual({ customerId: 'NEW1' });
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getCustomerTypes
  // -----------------------------------------------------------------------
  describe('getCustomerTypes', () => {
    it('returns customer type list', (done) => {
      const data = [{ code: 'HOS' }];
      httpSpy.get.and.returnValue(of(data));

      service.getCustomerTypes().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getStateCodes
  // -----------------------------------------------------------------------
  describe('getStateCodes', () => {
    it('returns state code list', (done) => {
      const data = [{ code: 'IL' }];
      httpSpy.get.and.returnValue(of(data));

      service.getStateCodes().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getPayees
  // -----------------------------------------------------------------------
  describe('getPayees', () => {
    it('returns payee list', (done) => {
      const data = [{ payeeId: 'PAY1' }];
      httpSpy.get.and.returnValue(of(data));

      service.getPayees().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getPlasmaFileTypes
  // -----------------------------------------------------------------------
  describe('getPlasmaFileTypes', () => {
    it('returns plasma file type list', (done) => {
      const data = [{ code: 'PFT1' }];
      httpSpy.get.and.returnValue(of(data));

      service.getPlasmaFileTypes().subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createConsignee
  // -----------------------------------------------------------------------
  describe('createConsignee', () => {
    it('posts consignee and returns response data', (done) => {
      const data = { consigneeId: 'CON1' };
      httpSpy.post.and.returnValue(of({ data }));

      service.createConsignee('C1', { name: 'Test' }).subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getConsignees
  // -----------------------------------------------------------------------
  describe('getConsignees', () => {
    it('returns consignee list', (done) => {
      const data = [{ consigneeId: 'CON1' }];
      httpSpy.get.and.returnValue(of({ data }));

      service.getConsignees('C1').subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateConsignee
  // -----------------------------------------------------------------------
  describe('updateConsignee', () => {
    it('puts consignee update and returns response data', (done) => {
      const data = { consigneeId: 'CON1' };
      httpSpy.put.and.returnValue(of({ data }));

      service.updateConsignee('C1', 'CON1', { name: 'Updated' }).subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getZones
  // -----------------------------------------------------------------------
  describe('getZones', () => {
    it('returns zone list', (done) => {
      const data = [{ zoneId: 'Z1' }];
      httpSpy.get.and.returnValue(of(data));

      service.getZones().subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createContract
  // -----------------------------------------------------------------------
  describe('createContract', () => {
    it('posts contract and returns response data', (done) => {
      const data = { contractId: 'CT1' };
      httpSpy.post.and.returnValue(of({ data }));

      service.createContract('C1', { type: 'Standard' }).subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getContracts
  // -----------------------------------------------------------------------
  describe('getContracts', () => {
    it('returns contract list', (done) => {
      const data = [{ contractId: 'CT1' }];
      httpSpy.get.and.returnValue(of({ data }));

      service.getContracts('C1').subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateContract
  // -----------------------------------------------------------------------
  describe('updateContract', () => {
    it('puts contract update and returns response data', (done) => {
      const data = { contractId: 'CT1' };
      httpSpy.put.and.returnValue(of({ data }));

      service.updateContract('C1', 'CT1', { type: 'Updated' }).subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createContact
  // -----------------------------------------------------------------------
  describe('createContact', () => {
    it('posts contact and returns response data', (done) => {
      const data = { contactId: 'CTC1' };
      httpSpy.post.and.returnValue(of({ data }));

      service.createContact('C1', { name: 'John' }).subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getContacts
  // -----------------------------------------------------------------------
  describe('getContacts', () => {
    it('returns contact list', (done) => {
      const data = [{ contactId: 'CTC1' }];
      httpSpy.get.and.returnValue(of({ data }));

      service.getContacts('C1').subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getContactTypes
  // -----------------------------------------------------------------------
  describe('getContactTypes', () => {
    it('returns contact type list', (done) => {
      const data = [{ typeId: 'T1' }];
      httpSpy.get.and.returnValue(of({ data }));

      service.getContactTypes().subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });
  });
});
