import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DonorInterdictionOverrideService } from './donor-interdiction-override.service';
import { ApiService } from '@shared/services/api.service';

describe('DonorInterdictionOverrideService', () => {
  let service: DonorInterdictionOverrideService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete', 'patch']);

    TestBed.configureTestingModule({
      providers: [
        DonorInterdictionOverrideService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonorInterdictionOverrideService);
  });

  describe('getDonorInterdictionOverrides', () => {
    it('should return normalized data and totalRecords on success', (done) => {
      const apiResponse = {
        Data: [
          { DonorDecisionCode: 'ACC', DecisionDesc: 'Acceptable', ProductType: 'RBC' },
          { DonorDecisionCode: 'DEF', DecisionDesc: 'Deferred', ProductType: 'PLT' }
        ],
        Total: 50
      };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(50);
        expect(result.data[0].donorDecisionCode).toBe('ACC');
        expect(result.data[0].decisionDesc).toBe('Acceptable');
        expect(result.data[1].productType).toBe('PLT');
        done();
      });
    });

    it('should handle lowercase response keys (data/total)', (done) => {
      const apiResponse = {
        data: [
          { donorDecisionCode: 'ACC', decisionDesc: 'Acceptable' }
        ],
        total: 10
      };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(10);
        expect(result.data[0].donorDecisionCode).toBe('ACC');
        done();
      });
    });

    it('should return empty data when response is null', (done) => {
      mockApiService.post.and.returnValue(of(null));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should use rawData.length as fallback when Total is missing', (done) => {
      const apiResponse = {
        Data: [
          { DonorDecisionCode: 'ACC' },
          { DonorDecisionCode: 'DEF' }
        ]
      };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe((result) => {
        expect(result.totalRecords).toBe(2);
        done();
      });
    });

    it('should rethrow error and log to console on API failure', (done) => {
      spyOn(console, 'error');
      const error = new Error('Network error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching donor interdiction override data:',
            error
          );
          done();
        }
      });
    });

    it('should normalize PascalCase property names to camelCase model', (done) => {
      const apiResponse = {
        Data: [{
          DonorDecisionCode: 'ACC',
          DecisionDesc: 'Acceptable',
          ProductType: 'RBC',
          ProductTypeDesc: 'Red Blood Cells',
          AttribGroup: 'GRP1',
          AttribCode: 'ATTR1',
          InterCode: 'HIV',
          InterDesc: 'HIV Positive',
          InterType: 'P',
          OverrideDesc: 'Override description',
          EffDate: '2024-01-15',
          TermDate: null,
          LastModifiedDate: '2024-06-15',
          ProgramId: 'PROG001'
        }],
        Total: 1
      };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getDonorInterdictionOverrides(10, 0, {}).subscribe((result) => {
        const item = result.data[0];
        expect(item.donorDecisionCode).toBe('ACC');
        expect(item.productType).toBe('RBC');
        expect(item.attributeGroup).toBe('GRP1');
        expect(item.attributeCode).toBe('ATTR1');
        expect(item.interCode).toBe('HIV');
        expect(item.interType).toBe('P');
        expect(item.overrideDesc).toBe('Override description');
        expect(item.effDate).toBe('2024-01-15');
        expect(item.termDate).toBeNull();
        expect(item.programId).toBe('PROG001');
        done();
      });
    });
  });

  describe('getDropdowns', () => {
    it('should extract dropdown data from response.Item', (done) => {
      const apiResponse = {
        Item: {
          DonorDecisionCodes: [{ Code: 'ACC', Description: 'Acceptable' }],
          ProductTypes: [{ Code: 'RBC', Description: 'Red Blood Cells' }],
          InterTypes: [{ Code: 'P', Description: 'Permanent' }]
        }
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getDropdowns().subscribe((result) => {
        expect(result.donorDecisionCodes!.length).toBe(1);
        expect(result.donorDecisionCodes![0].code).toBe('ACC');
        expect(result.donorDecisionCodes![0].description).toBe('Acceptable');
        expect(result.productTypes!.length).toBe(1);
        expect(result.interTypes!.length).toBe(1);
        done();
      });
    });

    it('should extract dropdown data from response.data array', (done) => {
      const apiResponse = {
        data: [{
          donorDecisionCodes: [{ code: 'DEF', description: 'Deferred' }],
          productTypes: [{ code: 'PLT', description: 'Platelets' }]
        }]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getDropdowns().subscribe((result) => {
        expect(result.donorDecisionCodes!.length).toBe(1);
        expect(result.donorDecisionCodes![0].code).toBe('DEF');
        expect(result.productTypes![0].code).toBe('PLT');
        done();
      });
    });

    it('should return empty object when response is null', (done) => {
      mockApiService.get.and.returnValue(of(null));

      service.getDropdowns().subscribe((result) => {
        expect(result).toEqual({});
        done();
      });
    });

    it('should handle direct dropdown properties on response root', (done) => {
      const apiResponse = {
        DonorDecisionCodes: [{ Code: 'ACC', Description: 'Acceptable' }],
        InterTypes: [{ Code: 'P', Description: 'Permanent' }]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getDropdowns().subscribe((result) => {
        expect(result.donorDecisionCodes!.length).toBe(1);
        expect(result.interTypes!.length).toBe(1);
        done();
      });
    });

    it('should rethrow error on API failure', (done) => {
      spyOn(console, 'error');
      const error = new Error('Dropdown fetch failed');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDropdowns().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching donor interdiction override dropdowns:',
            error
          );
          done();
        }
      });
    });
  });

  describe('createOverride', () => {
    it('should POST to create endpoint and return response', (done) => {
      const createData = {
        donorDecisionCode: 'ACC',
        productType: 'RBC',
        attribGroup: 'GRP1',
        attribCode: 'ATTR1',
        interCode: 'HIV',
        interType: 'P',
        overrideDesc: 'New override',
        effDate: '2025-01-01'
      };
      mockApiService.post.and.returnValue(of({ success: true }));

      service.createOverride(createData).subscribe((result) => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          createData
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should rethrow error on create failure', (done) => {
      spyOn(console, 'error');
      const error = new Error('Create failed');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.createOverride({} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error creating donor interdiction override:',
            error
          );
          done();
        }
      });
    });
  });

  describe('updateOverride', () => {
    it('should PUT to update endpoint using original keys for URL', (done) => {
      const updateData = {
        donorDecisionCode: 'NEW_CODE',
        productType: 'PLT',
        attribGroup: 'GRP1',
        attribCode: 'ATTR1',
        interCode: 'HBV',
        interType: 'T',
        overrideDesc: 'Updated override',
        effDate: '2025-02-01',
        originalDonorDecisionCode: 'ACC',
        originalProductType: 'RBC',
        originalInterCode: 'HIV'
      };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateOverride(updateData).subscribe((result) => {
        // Verify the payload does NOT include original* keys
        const actualPayload = mockApiService.put.calls.mostRecent().args[1];
        expect(actualPayload.originalDonorDecisionCode).toBeUndefined();
        expect(actualPayload.originalProductType).toBeUndefined();
        expect(actualPayload.originalInterCode).toBeUndefined();
        // But does include the updated values
        expect(actualPayload.donorDecisionCode).toBe('NEW_CODE');
        expect(actualPayload.interCode).toBe('HBV');
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should fall back to current keys when original keys are absent', (done) => {
      const updateData = {
        donorDecisionCode: 'ACC',
        productType: 'RBC',
        attribGroup: 'GRP1',
        attribCode: 'ATTR1',
        interCode: 'HIV',
        interType: 'P',
        overrideDesc: 'Updated',
        effDate: '2025-01-01'
      };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateOverride(updateData).subscribe(() => {
        // The endpoint URL uses the current keys as fallback
        const endpoint = mockApiService.put.calls.mostRecent().args[0];
        expect(endpoint).toContain('ACC');
        expect(endpoint).toContain('RBC');
        expect(endpoint).toContain('HIV');
        done();
      });
    });

    it('should rethrow error on update failure', (done) => {
      spyOn(console, 'error');
      const error = new Error('Update failed');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateOverride({
        donorDecisionCode: 'ACC',
        productType: 'RBC',
        interCode: 'HIV'
      } as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error updating donor interdiction override:',
            error
          );
          done();
        }
      });
    });
  });

  describe('getAttribCodesByGroup', () => {
    it('should return code/description array from array response', (done) => {
      const apiResponse = [
        { Code: 'AC1', Description: 'Attribute Code 1' },
        { Code: 'AC2', Description: 'Attribute Code 2' }
      ];
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getAttribCodesByGroup('GRP1').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('AC1');
        expect(result[0].description).toBe('Attribute Code 1');
        done();
      });
    });

    it('should extract from response.data when response is object', (done) => {
      const apiResponse = {
        data: [
          { code: 'AC1', description: 'Attr 1' }
        ]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getAttribCodesByGroup('GRP1').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('AC1');
        done();
      });
    });

    it('should handle string items by using string as code with empty description', (done) => {
      mockApiService.get.and.returnValue(of(['STR1', 'STR2']));

      service.getAttribCodesByGroup('GRP1').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'STR1', description: '' });
        expect(result[1]).toEqual({ code: 'STR2', description: '' });
        done();
      });
    });

    it('should rethrow error on API failure', (done) => {
      spyOn(console, 'error');
      const error = new Error('Attrib codes fetch failed');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getAttribCodesByGroup('GRP1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching attribute codes by group:',
            error
          );
          done();
        }
      });
    });
  });
});
