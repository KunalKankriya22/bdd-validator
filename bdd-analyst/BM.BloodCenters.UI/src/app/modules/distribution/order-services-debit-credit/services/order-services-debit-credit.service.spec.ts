import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderServicesDebitCreditService } from './order-services-debit-credit.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('OrderServicesDebitCreditService', () => {
  let service: OrderServicesDebitCreditService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        OrderServicesDebitCreditService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(OrderServicesDebitCreditService);
  });

  describe('create', () => {
    it('should post create adjustment dto', (done) => {
      const mockResp = { success: true, data: [] };
      apiServiceSpy.post.and.returnValue(of(mockResp));

      service.create({ tranType: 'D' } as any).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.CREATE,
          jasmine.any(Object)
        );
        expect(result).toEqual(mockResp as any);
        done();
      });
    });
  });

  describe('getNote', () => {
    it('should return first note from data array', (done) => {
      const note = { noteId: 1, noteText: 'Test note' };
      apiServiceSpy.get.and.returnValue(of({ data: [note] }));

      service.getNote('ADV1').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.GET_NOTE('ADV1')
        );
        expect(result).toEqual(note);
        done();
      });
    });
  });

  describe('addNote', () => {
    it('should post note text for advice id', (done) => {
      const mockResp = { success: true, data: [] };
      apiServiceSpy.post.and.returnValue(of(mockResp));

      service.addNote('ADV1', 'New note').subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.ADD_NOTE('ADV1'),
          { noteText: 'New note' }
        );
        expect(result).toEqual(mockResp as any);
        done();
      });
    });
  });

  describe('getCustomerLov', () => {
    it('should return mapped customer options', (done) => {
      const apiData = [{ customerId: 'C1', name: 'Customer 1' }];
      apiServiceSpy.get.and.returnValue(of({ data: apiData }));

      service.getCustomerLov('search').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.CUSTOMER_LOV('search')
        );
        expect(result).toEqual([{ code: 'C1', description: 'Customer 1' }]);
        done();
      });
    });
  });

  describe('getOrderNoLov', () => {
    it('should return mapped order number options', (done) => {
      const apiData = [{ orderNo: 'ORD1', localInsDate: '2026-01-01' }];
      apiServiceSpy.get.and.returnValue(of({ data: apiData }));

      service.getOrderNoLov('C1', 'D').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.ORDER_NO_LOV('C1', 'D', undefined)
        );
        expect(result).toEqual([{ code: 'ORD1', description: '2026-01-01' }]);
        done();
      });
    });
  });

  describe('getServiceCodeLov', () => {
    it('should return mapped service code options', (done) => {
      const apiData = [{ serviceCode: 'SVC1', description: 'Service 1', charge: 10.5 }];
      apiServiceSpy.get.and.returnValue(of({ data: apiData }));

      service.getServiceCodeLov('D', 'ORD1').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.SERVICE_CODE_LOV('D', 'ORD1')
        );
        expect(result).toEqual([{ code: 'SVC1', description: 'Service 1', charge: 10.5, editCharge: false }]);
        done();
      });
    });
  });

  describe('getReasonCodeLov', () => {
    it('should return mapped reason code options', (done) => {
      const apiData = [{ code: 'R1', codeDesc: 'Reason 1' }];
      apiServiceSpy.get.and.returnValue(of({ data: apiData }));

      service.getReasonCodeLov('D').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.REASON_CODE_LOV('D')
        );
        expect(result).toEqual([{ code: 'R1', description: 'Reason 1' }]);
        done();
      });
    });

    it('should default codeDesc to empty string when missing', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'R2' }] }));

      service.getReasonCodeLov('CR').subscribe((result) => {
        expect(result).toEqual([{ code: 'R2', description: '' }]);
        done();
      });
    });
  });

  describe('getPatientLov', () => {
    it('should return patient data array', (done) => {
      const patients = [{ patientName: 'John Doe', orderNo: 'ORD1' }];
      apiServiceSpy.get.and.returnValue(of({ data: patients }));

      service.getPatientLov('C1', 'CR', 'John').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.PATIENT_LOV('C1', 'CR', 'John')
        );
        expect(result).toEqual(patients);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getPatientLov('C1', 'CR').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getRequestedByLov', () => {
    it('should return requested-by data array', (done) => {
      const contacts = [{ contactName: 'Jane Smith' }];
      apiServiceSpy.get.and.returnValue(of({ data: contacts }));

      service.getRequestedByLov('C1').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ORDER_SERVICES_DEBIT_CREDIT.REQUESTED_BY_LOV('C1')
        );
        expect(result).toEqual(contacts);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getRequestedByLov('C1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getNote - edge cases', () => {
    it('should return null when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getNote('ADV1').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when data is empty', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getNote('ADV1').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getCustomerLov - edge cases', () => {
    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getCustomerLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default name to empty string when undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ customerId: 'C1' }] }));

      service.getCustomerLov().subscribe((result) => {
        expect(result).toEqual([{ code: 'C1', description: '' }]);
        done();
      });
    });

    it('should default name to empty string when null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ customerId: 'C2', name: null }] }));

      service.getCustomerLov().subscribe((result) => {
        expect(result).toEqual([{ code: 'C2', description: '' }]);
        done();
      });
    });
  });

  describe('getOrderNoLov - edge cases', () => {
    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getOrderNoLov('C1', 'DB').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default localInsDate to empty string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ orderNo: 'O1' }] }));

      service.getOrderNoLov('C1', 'DB').subscribe((result) => {
        expect(result).toEqual([{ code: 'O1', description: '' }]);
        done();
      });
    });
  });

  describe('getServiceCodeLov - edge cases', () => {
    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getServiceCodeLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default optional fields', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ serviceCode: 'S1' }] }));

      service.getServiceCodeLov().subscribe((result) => {
        expect(result).toEqual([{ code: 'S1', description: '', charge: null, editCharge: false }]);
        done();
      });
    });
  });
});
