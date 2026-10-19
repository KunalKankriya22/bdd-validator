import { TestBed } from '@angular/core/testing';
import { VenipunctureAttributesService } from './venipuncture-attributes.service';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { of, throwError } from 'rxjs';
import {
  VenipunctureAttributesModel,
  VenipunctureAttributesParamsDto,
  VenipunctureAttributesDto,
  UpdateVenipunctureAttributesDto
} from '../models/venipuncture-attributes.model';

describe('VenipunctureAttributesService', () => {
  let service: VenipunctureAttributesService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      providers: [
        VenipunctureAttributesService,
        { provide: ApiService, useValue: mockApiService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });

    service = TestBed.inject(VenipunctureAttributesService);
  });

  // -------------------------------------------------------
  // Preserved existing test intent: insertUser from login
  // -------------------------------------------------------
  it('should add insertUser from cookie when adding venipuncture attribute', (done) => {
    mockLoginService.getStoredUsername.and.returnValue('testuser');
    mockApiService.post.and.returnValue(of({ success: true }));

    const effectiveDate = new Date(2025, 1, 12);
    const testData: VenipunctureAttributesDto = {
      group: 'VENI',
      code: '01',
      description: 'Test',
      effectiveDate: effectiveDate,
      terminationDate: null
    };

    service.addVenipunctureAttribute(testData).subscribe(() => {
      const payload = mockApiService.post.calls.mostRecent().args[1];
      expect(payload.insertUser).toBe('testuser');
      done();
    });
  });

  it('should use DONSYS as fallback when cookie is not available', (done) => {
    mockLoginService.getStoredUsername.and.returnValue('');
    mockApiService.post.and.returnValue(of({ success: true }));

    const effectiveDate = new Date(2025, 1, 12);
    const testData: VenipunctureAttributesDto = {
      group: 'VENI',
      code: '01',
      description: 'Test',
      effectiveDate: effectiveDate,
      terminationDate: null
    };

    service.addVenipunctureAttribute(testData).subscribe(() => {
      const payload = mockApiService.post.calls.mostRecent().args[1];
      expect(payload.insertUser).toBe('DONSYS');
      done();
    });
  });

  // -------------------------------------------------------
  // getVenipunctureAttributes
  // -------------------------------------------------------
  describe('getVenipunctureAttributes', () => {
    const mockApiResponse = {
      success: true,
      data: [
        {
          group: 'GRP1',
          code: 'C01',
          description: 'Desc 1',
          effDate: '2025-01-15',
          termDate: '2025-12-31',
          insertDate: null,
          lastModifiedDate: null
        },
        {
          group: 'GRP2',
          code: 'C02',
          description: 'Desc 2',
          effDate: null,
          termDate: null,
          insertDate: null,
          lastModifiedDate: null
        }
      ],
      total: 50
    };

    it('should call apiService.post with correct endpoint and params', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));
      const params: VenipunctureAttributesParamsDto = { SearchKeyword: 'test' };

      service.getVenipunctureAttributes(25, 0, params).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('venipuncture-attributes/25/0');
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/venipuncture-attributes\/25\/0/),
          params
        );
        done();
      });
    });

    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));
      const params: VenipunctureAttributesParamsDto = {};

      service.getVenipunctureAttributes(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/venipuncture-attributes\/50\/100/),
          params
        );
        done();
      });
    });

    it('should map effDate to effectiveDate as Date objects', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data[0].effectiveDate).toEqual(jasmine.any(Date));
        expect(result.data[0].effectiveDate).toEqual(new Date('2025-01-15'));
        done();
      });
    });

    it('should map termDate to terminationDate as Date objects', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data[0].terminationDate).toEqual(jasmine.any(Date));
        expect(result.data[0].terminationDate).toEqual(new Date('2025-12-31'));
        done();
      });
    });

    it('should map null effDate to null effectiveDate', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data[1].effectiveDate).toBeNull();
        done();
      });
    });

    it('should map null termDate to null terminationDate', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data[1].terminationDate).toBeNull();
        done();
      });
    });

    it('should map group, code, and description fields', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data[0].group).toBe('GRP1');
        expect(result.data[0].code).toBe('C01');
        expect(result.data[0].description).toBe('Desc 1');
        done();
      });
    });

    it('should return totalRecords from response.total', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(50);
        done();
      });
    });

    it('should fallback to response.data.length when total is missing', (done) => {
      const responseNoTotal = {
        success: true,
        data: [
          { group: 'G1', code: 'C1', description: 'D1', effDate: null, termDate: null }
        ]
      };
      mockApiService.post.and.returnValue(of(responseNoTotal));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(1);
        done();
      });
    });

    it('should return 0 totalRecords when both total and data are missing', (done) => {
      const responseEmpty = { success: true };
      mockApiService.post.and.returnValue(of(responseEmpty));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should handle empty data array', (done) => {
      const responseEmptyData = { success: true, data: [], total: 0 };
      mockApiService.post.and.returnValue(of(responseEmptyData));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should handle null data in response', (done) => {
      const responseNullData = { success: true, data: null, total: 0 };
      mockApiService.post.and.returnValue(of(responseNullData));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getVenipunctureAttributes(25, 0, {}).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching venipuncture attributes data:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // getVenipunctureAttributesFilters
  // -------------------------------------------------------
  describe('getVenipunctureAttributesFilters', () => {
    it('should call apiService.get with the correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: [{ code: 'A' }, { code: 'B' }]
      }));

      service.getVenipunctureAttributesFilters().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/venipuncture-attributes\/codes/)
        );
        done();
      });
    });

    it('should extract code values from array of objects', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: [{ code: 'ALPHA' }, { code: 'BETA' }, { code: 'GAMMA' }]
      }));

      service.getVenipunctureAttributesFilters().subscribe(result => {
        expect(result.data).toEqual([{ code: ['ALPHA', 'BETA', 'GAMMA'] }]);
        done();
      });
    });

    it('should return success and message from response', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'Filters loaded',
        data: [{ code: 'X' }]
      }));

      service.getVenipunctureAttributesFilters().subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Filters loaded');
        done();
      });
    });

    it('should handle empty data array', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: []
      }));

      service.getVenipunctureAttributesFilters().subscribe(result => {
        expect(result.data).toEqual([{ code: [] }]);
        done();
      });
    });

    it('should handle null data in response', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: null
      }));

      service.getVenipunctureAttributesFilters().subscribe(result => {
        expect(result.data).toEqual([{ code: [] }]);
        done();
      });
    });

    it('should handle undefined data in response', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK'
      }));

      service.getVenipunctureAttributesFilters().subscribe(result => {
        expect(result.data).toEqual([{ code: [] }]);
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('Filter API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getVenipunctureAttributesFilters().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching venipuncture attributes filters:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // getVenipunctureAttributeByGroupAndCode
  // -------------------------------------------------------
  describe('getVenipunctureAttributeByGroupAndCode', () => {
    const mockDetailResponse = {
      group: 'VENI',
      code: 'A01',
      description: 'Test Attribute',
      effDate: '2025-03-01',
      termDate: '2025-09-30',
      lastModifiedDate: '2025-04-15T10:00:00'
    };

    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/venipuncture-attributes\/VENI\/A01/)
        );
        done();
      });
    });

    it('should map effDate to effectiveDate as Date', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(result => {
        expect(result.effectiveDate).toEqual(new Date('2025-03-01'));
        done();
      });
    });

    it('should map termDate to terminationDate as Date', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(result => {
        expect(result.terminationDate).toEqual(new Date('2025-09-30'));
        done();
      });
    });

    it('should map lastModifiedDate as Date', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(result => {
        expect(result.lastModifiedDate).toEqual(new Date('2025-04-15T10:00:00'));
        done();
      });
    });

    it('should use response.group when available', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(result => {
        expect(result.group).toBe('VENI');
        done();
      });
    });

    it('should fallback to parameter group when response.group is falsy', (done) => {
      const responseNoGroup = {
        group: '',
        code: 'A01',
        description: 'Test',
        effDate: null,
        termDate: null,
        lastModifiedDate: null
      };
      mockApiService.get.and.returnValue(of(responseNoGroup));

      service.getVenipunctureAttributeByGroupAndCode('PARAM_GROUP', 'A01').subscribe(result => {
        expect(result.group).toBe('PARAM_GROUP');
        done();
      });
    });

    it('should fallback to parameter group when response.group is undefined', (done) => {
      const responseUndefinedGroup = {
        code: 'A01',
        description: 'Test',
        effDate: null,
        termDate: null,
        lastModifiedDate: null
      };
      mockApiService.get.and.returnValue(of(responseUndefinedGroup));

      service.getVenipunctureAttributeByGroupAndCode('FALLBACK', 'A01').subscribe(result => {
        expect(result.group).toBe('FALLBACK');
        done();
      });
    });

    it('should map code and description from response', (done) => {
      mockApiService.get.and.returnValue(of(mockDetailResponse));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe(result => {
        expect(result.code).toBe('A01');
        expect(result.description).toBe('Test Attribute');
        done();
      });
    });

    it('should handle null effDate', (done) => {
      const responseNullDates = {
        group: 'GRP',
        code: 'C1',
        description: 'Desc',
        effDate: null,
        termDate: null,
        lastModifiedDate: null
      };
      mockApiService.get.and.returnValue(of(responseNullDates));

      service.getVenipunctureAttributeByGroupAndCode('GRP', 'C1').subscribe(result => {
        expect(result.effectiveDate).toBeNull();
        expect(result.terminationDate).toBeNull();
        expect(result.lastModifiedDate).toBeNull();
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('Detail API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getVenipunctureAttributeByGroupAndCode('VENI', 'A01').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching venipuncture attribute:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // addVenipunctureAttribute
  // -------------------------------------------------------
  describe('addVenipunctureAttribute', () => {
    it('should call apiService.post with correct endpoint', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'New Attr',
        effectiveDate: new Date(2025, 0, 15),
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const endpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(endpoint).toMatch(/venipuncture-attributes$/);
        done();
      });
    });

    it('should format effectiveDate as DD-MMM-YYYY in payload', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date(2025, 1, 12), // Feb 12, 2025
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.effectiveDate).toBe('12-Feb-2025');
        done();
      });
    });

    it('should format terminationDate as DD-MMM-YYYY when provided', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: new Date(2025, 11, 31) // Dec 31, 2025
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.terminationDate).toBe('31-Dec-2025');
        done();
      });
    });

    it('should set terminationDate to null when not provided', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.terminationDate).toBeNull();
        done();
      });
    });

    it('should include group, code, and description in payload', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'MY_GROUP',
        code: 'MY_CODE',
        description: 'My Description',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.group).toBe('MY_GROUP');
        expect(payload.code).toBe('MY_CODE');
        expect(payload.description).toBe('My Description');
        done();
      });
    });

    it('should use loginService.getStoredUsername for insertUser', (done) => {
      mockLoginService.getStoredUsername.and.returnValue('admin_user');
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.insertUser).toBe('admin_user');
        expect(mockLoginService.getStoredUsername).toHaveBeenCalled();
        done();
      });
    });

    it('should handle null effectiveDate in payload', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: null,
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.effectiveDate).toBeNull();
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('Add API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const testData: VenipunctureAttributesDto = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error adding venipuncture attribute:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // updateVenipunctureAttribute
  // -------------------------------------------------------
  describe('updateVenipunctureAttribute', () => {
    const baseUpdateData: UpdateVenipunctureAttributesDto = {
      currentGroup: 'OLD_GRP',
      currentCode: 'OLD_CD',
      group: 'NEW_GRP',
      code: 'NEW_CD',
      description: 'Updated Desc',
      effectiveDate: new Date(2025, 5, 15), // Jun 15, 2025
      terminationDate: new Date(2025, 11, 31) // Dec 31, 2025
    };

    it('should call apiService.put with endpoint constructed from currentGroup and currentCode', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe(() => {
        const endpoint = mockApiService.put.calls.mostRecent().args[0];
        expect(endpoint).toContain('OLD_GRP');
        expect(endpoint).toContain('OLD_CD');
        done();
      });
    });

    it('should send new group, code, and description in payload', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.group).toBe('NEW_GRP');
        expect(payload.code).toBe('NEW_CD');
        expect(payload.description).toBe('Updated Desc');
        done();
      });
    });

    it('should format effectiveDate as DD-MMM-YYYY', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.effectiveDate).toBe('15-Jun-2025');
        done();
      });
    });

    it('should format terminationDate as DD-MMM-YYYY when provided', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.terminationDate).toBe('31-Dec-2025');
        done();
      });
    });

    it('should set terminationDate to null when not provided', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      const dataNoTerm: UpdateVenipunctureAttributesDto = {
        ...baseUpdateData,
        terminationDate: null
      };

      service.updateVenipunctureAttribute(dataNoTerm).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.terminationDate).toBeNull();
        done();
      });
    });

    it('should set terminationDate to null when undefined', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      const dataUndefinedTerm: UpdateVenipunctureAttributesDto = {
        currentGroup: 'GRP',
        currentCode: 'CD',
        group: 'GRP',
        code: 'CD',
        description: 'D',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: undefined
      };

      service.updateVenipunctureAttribute(dataUndefinedTerm).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.terminationDate).toBeNull();
        done();
      });
    });

    it('should not include insertUser in update payload', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe(() => {
        const payload = mockApiService.put.calls.mostRecent().args[1];
        expect(payload.insertUser).toBeUndefined();
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('Update API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateVenipunctureAttribute(baseUpdateData).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error updating venipuncture attribute:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // getVenipunctureAttributesGroups
  // -------------------------------------------------------
  describe('getVenipunctureAttributesGroups', () => {
    it('should call apiService.get with the correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: [],
        total: 0
      }));

      service.getVenipunctureAttributesGroups().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/venipuncture-attributes\/groups/)
        );
        done();
      });
    });

    it('should return group data from response', (done) => {
      const groups = [
        { groupName: 'VENI', groupDesc: 'Venipuncture' },
        { groupName: 'PHLE', groupDesc: 'Phlebotomy' }
      ];
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: groups,
        total: 2
      }));

      service.getVenipunctureAttributesGroups().subscribe(result => {
        expect(result).toEqual(groups);
        expect(result.length).toBe(2);
        expect(result[0].groupName).toBe('VENI');
        expect(result[1].groupDesc).toBe('Phlebotomy');
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        data: null,
        total: 0
      }));

      service.getVenipunctureAttributesGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        message: 'OK',
        total: 0
      }));

      service.getVenipunctureAttributesGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should log error and rethrow on API failure', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('Groups API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getVenipunctureAttributesGroups().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching venipuncture attributes groups:',
            error
          );
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // -------------------------------------------------------
  // Date formatting (tested via public methods)
  // -------------------------------------------------------
  describe('Date Formatting (via addVenipunctureAttribute)', () => {
    beforeEach(() => {
      mockApiService.post.and.returnValue(of({ success: true }));
    });

    it('should format single-digit day with leading zero', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G',
        code: 'C',
        description: 'D',
        effectiveDate: new Date(2025, 0, 5), // Jan 5
        terminationDate: null
      };

      service.addVenipunctureAttribute(testData).subscribe(() => {
        const payload = mockApiService.post.calls.mostRecent().args[1];
        expect(payload.effectiveDate).toBe('05-Jan-2025');
        done();
      });
    });

    it('should format January correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 0, 15), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('15-Jan-2025');
        done();
      });
    });

    it('should format March correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 2, 20), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('20-Mar-2025');
        done();
      });
    });

    it('should format June correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 5, 1), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('01-Jun-2025');
        done();
      });
    });

    it('should format September correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 8, 30), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('30-Sep-2025');
        done();
      });
    });

    it('should format December correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 11, 25), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('25-Dec-2025');
        done();
      });
    });

    it('should handle day 31 correctly', (done) => {
      const testData: VenipunctureAttributesDto = {
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(2025, 0, 31), terminationDate: null
      };
      service.addVenipunctureAttribute(testData).subscribe(() => {
        expect(mockApiService.post.calls.mostRecent().args[1].effectiveDate).toBe('31-Jan-2025');
        done();
      });
    });
  });

  // -------------------------------------------------------
  // HTTP method verification
  // -------------------------------------------------------
  describe('HTTP Methods', () => {
    it('should use POST for getVenipunctureAttributes', (done) => {
      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getVenipunctureAttributes(25, 0, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should use GET for getVenipunctureAttributesFilters', (done) => {
      mockApiService.get.and.returnValue(of({ success: true, message: '', data: [] }));

      service.getVenipunctureAttributesFilters().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should use GET for getVenipunctureAttributeByGroupAndCode', (done) => {
      mockApiService.get.and.returnValue(of({ group: 'G', code: 'C' }));

      service.getVenipunctureAttributeByGroupAndCode('G', 'C').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should use POST for addVenipunctureAttribute', (done) => {
      mockApiService.post.and.returnValue(of({ success: true }));

      service.addVenipunctureAttribute({
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(), terminationDate: null
      }).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should use PUT for updateVenipunctureAttribute', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateVenipunctureAttribute({
        currentGroup: 'G', currentCode: 'C',
        group: 'G', code: 'C', description: 'D',
        effectiveDate: new Date(), terminationDate: null
      }).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should use GET for getVenipunctureAttributesGroups', (done) => {
      mockApiService.get.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.getVenipunctureAttributesGroups().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });
  });
});
