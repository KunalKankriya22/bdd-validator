import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VehicleDetailsService } from './vehicle-details.service';
import {
  VehicleDetailsFilter,
  VehicleDetails,
  CreateVehicleDetails,
  UpdateVehicleDetails,
  VehicleNote,
  ReturnResult,
  SingleReturnResult
} from '../models/vehicle-details.model';
import { HeaderService } from '@shared/services/header.service';
import { environment } from 'src/environments/environment';

describe('VehicleDetailsService', () => {
  let service: VehicleDetailsService;
  let httpMock: HttpTestingController;
  const mockChapterId = 'ABC';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VehicleDetailsService,
        {
          provide: HeaderService,
          useValue: { getCurrentChapterId: () => mockChapterId }
        }
      ]
    });
    service = TestBed.inject(VehicleDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getVehicles
  // ---------------------------------------------------------------------------
  describe('getVehicles', () => {
    it('should get vehicles with pagination at page 0', () => {
      const filter: VehicleDetailsFilter = {};
      const mockResponse: ReturnResult<VehicleDetails> = {
        data: [{ vehicleId: 'V001', vehicleName: 'Test', vehicleType: 'VAN', effectiveDate: '2025-01-01' }],
        total: 1
      };

      service.getVehicles(filter, 10, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filter);
      req.flush(mockResponse);
    });

    it('should calculate correct skip value for page > 0', () => {
      const filter: VehicleDetailsFilter = { searchText: 'van' };

      service.getVehicles(filter, 25, 3).subscribe(result => {
        expect(result.data.length).toBe(0);
        expect(result.total).toBe(100);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/25/75`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filter);
      req.flush({ data: [], total: 100 });
    });

    it('should default data to empty array when response data is null', () => {
      const filter: VehicleDetailsFilter = {};

      service.getVehicles(filter, 10, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/10/0`);
      req.flush({ data: null, total: null });
    });

    it('should default data to empty array when response data is undefined', () => {
      const filter: VehicleDetailsFilter = {};

      service.getVehicles(filter, 10, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/10/0`);
      req.flush({});
    });

    it('should propagate HTTP errors', () => {
      const filter: VehicleDetailsFilter = {};

      service.getVehicles(filter, 10, 0).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/10/0`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getVehicleById
  // ---------------------------------------------------------------------------
  describe('getVehicleById', () => {
    it('should get a single vehicle by ID', () => {
      const mockVehicle: VehicleDetails = {
        vehicleId: 'V001',
        vehicleName: 'Test Vehicle',
        vehicleType: 'VAN',
        effectiveDate: '2025-01-01'
      };
      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: mockVehicle
      };

      service.getVehicleById('V001').subscribe(vehicle => {
        expect(vehicle).toEqual(mockVehicle);
        expect(vehicle.vehicleId).toBe('V001');
        expect(vehicle.vehicleName).toBe('Test Vehicle');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in vehicleId', () => {
      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: { vehicleId: 'V/001', vehicleName: 'Special', vehicleType: 'VAN', effectiveDate: '2025-01-01' }
      };

      service.getVehicleById('V/001').subscribe(vehicle => {
        expect(vehicle.vehicleId).toBe('V/001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V%2F001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getVehicleById('INVALID').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/INVALID`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ---------------------------------------------------------------------------
  // getVehicleTypes
  // ---------------------------------------------------------------------------
  describe('getVehicleTypes', () => {
    it('should get vehicle types with showTerminated defaulting to false', () => {
      const mockResponse = {
        success: true,
        message: 'Successfully retrieved 4 vehicle types',
        statusCode: 200,
        data: [
          { code: 'COACH' },
          { code: 'OTHER' },
          { code: 'PIKUP' },
          { code: 'VAN' }
        ]
      };

      service.getVehicleTypes().subscribe(types => {
        expect(types.length).toBe(4);
        expect(types[0]).toEqual({ value: 'COACH', label: 'COACH' });
        expect(types[3]).toEqual({ value: 'VAN', label: 'VAN' });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/types?showTerminated=false`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass showTerminated=true when requested', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{ code: 'VAN' }, { code: 'OLDTYPE' }]
      };

      service.getVehicleTypes(true).subscribe(types => {
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/types?showTerminated=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should default data to empty array when response data is null', () => {
      service.getVehicleTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/types?showTerminated=false`);
      req.flush({ success: true, data: null });
    });

    it('should default data to empty array when response data is undefined', () => {
      service.getVehicleTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/types?showTerminated=false`);
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.getVehicleTypes().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/types?showTerminated=false`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getVehicleIds
  // ---------------------------------------------------------------------------
  describe('getVehicleIds', () => {
    it('should get vehicle IDs with showTerminated defaulting to false', () => {
      const mockResponse = {
        success: true,
        message: 'Successfully retrieved 2 vehicle IDs',
        statusCode: 200,
        data: [
          { code: 'VECHL11111', description: 'VT-01' },
          { code: 'VECHL11112', description: 'VT-02' }
        ]
      };

      service.getVehicleIds().subscribe(ids => {
        expect(ids.length).toBe(2);
        expect(ids[0]).toEqual({ value: 'VECHL11111', label: 'VECHL11111 - VT-01' });
        expect(ids[1]).toEqual({ value: 'VECHL11112', label: 'VECHL11112 - VT-02' });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/vehicle-ids?showTerminated=false`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass showTerminated=true when requested', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{ code: 'V001', description: 'Retired Van' }]
      };

      service.getVehicleIds(true).subscribe(ids => {
        expect(ids.length).toBe(1);
        expect(ids[0]).toEqual({ value: 'V001', label: 'V001 - Retired Van' });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/vehicle-ids?showTerminated=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should default data to empty array when response data is null', () => {
      service.getVehicleIds().subscribe(ids => {
        expect(ids).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/vehicle-ids?showTerminated=false`);
      req.flush({ success: true, data: null });
    });

    it('should default data to empty array when response data is undefined', () => {
      service.getVehicleIds().subscribe(ids => {
        expect(ids).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/vehicle-ids?showTerminated=false`);
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.getVehicleIds().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/vehicle-ids?showTerminated=false`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // createVehicle
  // ---------------------------------------------------------------------------
  describe('createVehicle', () => {
    it('should create a new vehicle', () => {
      const newVehicle: CreateVehicleDetails = {
        vehicleName: 'New Van',
        vehicleType: 'VAN',
        identificationNumber: 'VIN123',
        licensePlate: 'ABC-1234',
        registrationDate: '2025-06-01',
        commissionDate: '2025-06-15',
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: '2025-05-01',
        inspectionRenewalDate: '2026-05-01',
        effectiveDate: '2025-01-01',
        terminationDate: null,
        notes: [{ chapterId: 'ABC', note: 'Initial note' }]
      };

      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: {
          vehicleId: 'V999',
          vehicleName: 'New Van',
          vehicleType: 'VAN',
          effectiveDate: '2025-01-01'
        }
      };

      service.createVehicle(newVehicle).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.data!.vehicleId).toBe('V999');
        expect(result.data!.vehicleName).toBe('New Van');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newVehicle);
      req.flush(mockResponse);
    });

    it('should create a vehicle with minimal fields (nulls)', () => {
      const minimalVehicle: CreateVehicleDetails = {
        vehicleName: 'Minimal',
        vehicleType: 'OTHER',
        identificationNumber: null,
        licensePlate: null,
        registrationDate: null,
        commissionDate: null,
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: null,
        inspectionRenewalDate: null,
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: {
          vehicleId: 'V100',
          vehicleName: 'Minimal',
          vehicleType: 'OTHER',
          effectiveDate: '2025-01-01'
        }
      };

      service.createVehicle(minimalVehicle).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.data!.vehicleType).toBe('OTHER');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(minimalVehicle);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      const newVehicle: CreateVehicleDetails = {
        vehicleName: 'Fail',
        vehicleType: 'VAN',
        identificationNumber: null,
        licensePlate: null,
        registrationDate: null,
        commissionDate: null,
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: null,
        inspectionRenewalDate: null,
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      service.createVehicle(newVehicle).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ---------------------------------------------------------------------------
  // updateVehicle
  // ---------------------------------------------------------------------------
  describe('updateVehicle', () => {
    it('should update an existing vehicle', () => {
      const updatedVehicle: UpdateVehicleDetails = {
        vehicleId: 'V001',
        vehicleName: 'Updated Van',
        vehicleType: 'VAN',
        identificationNumber: 'VIN456',
        licensePlate: 'XYZ-9999',
        registrationDate: '2025-06-01',
        commissionDate: '2025-06-15',
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: '2025-05-01',
        inspectionRenewalDate: '2026-05-01',
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: {
          vehicleId: 'V001',
          vehicleName: 'Updated Van',
          vehicleType: 'VAN',
          effectiveDate: '2025-01-01'
        }
      };

      service.updateVehicle('V001', updatedVehicle).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.data!.vehicleName).toBe('Updated Van');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedVehicle);
      req.flush(mockResponse);
    });

    it('should encode special characters in vehicleId', () => {
      const updatedVehicle: UpdateVehicleDetails = {
        vehicleId: 'V/001',
        vehicleName: 'Special',
        vehicleType: 'VAN',
        identificationNumber: null,
        licensePlate: null,
        registrationDate: null,
        commissionDate: null,
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: null,
        inspectionRenewalDate: null,
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      const mockResponse: SingleReturnResult<VehicleDetails> = {
        success: true,
        data: {
          vehicleId: 'V/001',
          vehicleName: 'Special',
          vehicleType: 'VAN',
          effectiveDate: '2025-01-01'
        }
      };

      service.updateVehicle('V/001', updatedVehicle).subscribe(result => {
        expect(result.data!.vehicleId).toBe('V/001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V%2F001`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      const updatedVehicle: UpdateVehicleDetails = {
        vehicleId: 'V001',
        vehicleName: 'Fail',
        vehicleType: 'VAN',
        identificationNumber: null,
        licensePlate: null,
        registrationDate: null,
        commissionDate: null,
        decommissionDate: null,
        fdaLicenseDate: null,
        fdaRenewalDate: null,
        lastInspectionDate: null,
        inspectionRenewalDate: null,
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      service.updateVehicle('V001', updatedVehicle).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // ---------------------------------------------------------------------------
  // getNotes
  // ---------------------------------------------------------------------------
  describe('getNotes', () => {
    it('should get notes for a vehicle', () => {
      const mockResponse: ReturnResult<VehicleNote> = {
        success: true,
        data: [
          { noteId: 'N001', chapterId: mockChapterId, noteSequence: 1, note: 'Note 1', programId: 'CONVERT', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 12345 }
        ]
      };

      service.getNotes('V001').subscribe(notes => {
        expect(notes.length).toBe(1);
        expect(notes[0].note).toBe('Note 1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should default to empty array when response data is null', () => {
      service.getNotes('V001').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush({ success: true, data: null });
    });

    it('should default to empty array when response data is undefined', () => {
      service.getNotes('V001').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.getNotes('V001').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // addNote
  // ---------------------------------------------------------------------------
  describe('addNote', () => {
    it('should add a note with the current chapter ID', () => {
      const mockResponse: ReturnResult<VehicleNote> = {
        success: true,
        data: [{ noteId: 'VEHICLE123', chapterId: mockChapterId, noteSequence: 1, note: 'Test note', programId: 'CONVERT', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 12345 }]
      };

      service.addNote('V001', 'Test note').subscribe(notes => {
        expect(notes.length).toBe(1);
        expect(notes[0].note).toBe('Test note');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ chapterId: mockChapterId, note: 'Test note' });
      req.flush(mockResponse);
    });

    it('should default to empty array when response data is null', () => {
      service.addNote('V001', 'Note').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush({ success: true, data: null });
    });

    it('should default to empty array when response data is undefined', () => {
      service.addNote('V001', 'Note').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.addNote('V001', 'Test note').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // updateNote
  // ---------------------------------------------------------------------------
  describe('updateNote', () => {
    it('should update a note', () => {
      const mockResponse: ReturnResult<VehicleNote> = {
        success: true,
        data: [{ noteId: 'VEHICLE123', chapterId: mockChapterId, noteSequence: 1, note: 'Updated note', programId: 'CONVERT', insertDate: new Date().toISOString(), insertUser: 'DONSYS', auditKey: 12345 }]
      };

      service.updateNote('VEHICLE123', 12345, 'Updated note').subscribe(notes => {
        expect(notes.length).toBe(1);
        expect(notes[0].note).toBe('Updated note');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/notes/VEHICLE123/12345`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Updated note' });
      req.flush(mockResponse);
    });

    it('should default to empty array when response data is null', () => {
      service.updateNote('N001', 111, 'Note').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/notes/N001/111`);
      req.flush({ success: true, data: null });
    });

    it('should default to empty array when response data is undefined', () => {
      service.updateNote('N001', 111, 'Note').subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/notes/N001/111`);
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.updateNote('N001', 111, 'Note').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/notes/N001/111`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteNote
  // ---------------------------------------------------------------------------
  describe('deleteNote', () => {
    it('should delete a note', () => {
      service.deleteNote('V001', 12345).subscribe(result => {
        expect(result.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes/12345`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.deleteNote('V001', 12345).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/valid-vehicles/V001/notes/12345`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
