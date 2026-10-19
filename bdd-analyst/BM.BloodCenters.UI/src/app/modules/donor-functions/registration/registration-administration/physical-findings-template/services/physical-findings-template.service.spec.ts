import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';

import { PhysicalFindingsTemplateService } from './physical-findings-template.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('PhysicalFindingsTemplateService', () => {
  let service: PhysicalFindingsTemplateService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockChapterId = 'TEST';

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'patch', 'delete']);
    headerServiceSpy = createMockHeaderService({ chapterId: signal('TEST') });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PhysicalFindingsTemplateService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(PhysicalFindingsTemplateService);
  });

  it('should call getTemplates with correct parameters', () => {
    service.getTemplates(25, 0, { donationType: 'DI' });
    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/25/0',
      jasmine.objectContaining({ donationType: 'DI', showInactive: false })
    );
  });

  it('should call getDonationTypes with showInactive false', () => {
    service.getDonationTypes();
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/donation-types?showInactive=false&forFilter=false'
    );
  });

  it('should call getDonationTypes with showInactive true', () => {
    service.getDonationTypes(true);
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/donation-types?showInactive=true&forFilter=false'
    );
  });

  it('should call getDonationTypes with forFilter true', () => {
    service.getDonationTypes(false, true);
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/donation-types?showInactive=false&forFilter=true'
    );
  });

  it('should call getProcedureCodes with donation type and showInactive false', () => {
    service.getProcedureCodes('DI');
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/procedure-codes?donationType=DI&showInactive=false&forFilter=false'
    );
  });

  it('should call getProcedureCodes with showInactive true', () => {
    service.getProcedureCodes('DI', true);
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/procedure-codes?donationType=DI&showInactive=true&forFilter=false'
    );
  });

  it('should call getProcedureCodes with forFilter true', () => {
    service.getProcedureCodes('DI', false, true);
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/procedure-codes?donationType=DI&showInactive=false&forFilter=true'
    );
  });

  it('should call getPhysicalCodes', () => {
    service.getPhysicalCodes();
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/physical-codes'
    );
  });

  it('should call getTemplateDetails with correct parameters', () => {
    service.getTemplateDetails('TMPL001', 'DI', 'WB');
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      `/api/v1/physical-findings-templates/TMPL001?chapterId=${mockChapterId}&donationType=DI&procedureCode=WB`
    );
  });

  it('should call getTemplateDetails without procedure code', () => {
    service.getTemplateDetails('TMPL001', 'DI', null);
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      `/api/v1/physical-findings-templates/TMPL001?chapterId=${mockChapterId}&donationType=DI`
    );
  });

  it('should call createTemplate with correct payload', () => {
    const createDto = {
      donationType: 'DI',
      procedureCode: 'WB',
      effectiveDate: new Date(),
      terminationDate: null,
      physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
    };

    service.createTemplate(createDto);
    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates',
      jasmine.objectContaining({
        donationType: 'DI',
        procedureCode: 'WB',
        chapterId: mockChapterId,
        resolveOverlaps: false
      }),
      jasmine.any(Object)
    );
  });

  it('should call updateTemplate with correct payload', () => {
    const updateDto = {
      templateId: 'TMPL001',
      donationType: 'DI',
      procedureCode: 'WB',
      effectiveDate: new Date(),
      terminationDate: null,
      physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
    };

    service.updateTemplate(updateDto);
    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/TMPL001',
      jasmine.objectContaining({
        donationType: 'DI',
        procedureCode: 'WB',
        chapterId: mockChapterId,
        resolveOverlaps: false
      }),
      jasmine.any(Object)
    );
  });

  it('should call updateTerminationDate with correct payload', () => {
    const terminationDate = new Date();
    const updateDto = {
      templateIds: ['TMPL001'],
      donationType: 'DI',
      procedureCode: 'WB',
      terminationDate: terminationDate
    };

    service.updateTerminationDate(updateDto);
    expect(apiServiceSpy.patch).toHaveBeenCalledWith(
      `/api/v1/physical-findings-templates/TMPL001/term-date?chapterId=${mockChapterId}&donationType=DI&procedureCode=WB`,
      jasmine.objectContaining({ termDate: jasmine.any(String) })
    );
  });

  it('should call deletePhysicalCode with correct path', () => {
    service.deletePhysicalCode('TMPL001', 'ARMK', 'DI', 'WB');
    expect(apiServiceSpy.delete).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/TMPL001/ARMK?donationType=DI&procedureCode=WB'
    );
  });

  it('should call getTemplateList with correct parameters', () => {
    service.getTemplateList('DI', 'WB');
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      '/api/v1/physical-findings-templates/templates?donationType=DI&procedureCode=WB'
    );
  });

  // --- Additional tests for full coverage ---

  describe('getTemplates', () => {
    it('should call with no params and default showInactive to false', () => {
      service.getTemplates(10, 0);
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/10/0',
        jasmine.objectContaining({ showInactive: false })
      );
    });

    it('should pass all filter params when provided', () => {
      const params = {
        donationType: 'DI',
        procedureCode: 'WB',
        templateId: 'TMPL001',
        physicalCode: 'ARMK',
        status: 'ACTIVE' as const,
        showInactive: true,
        searchKeyword: 'test',
        sort: 'ASC' as const,
        sortColumn: 'templateId',
        effectiveDateBefore: '2025-12-31',
        effectiveDateAfter: '2025-01-01',
        terminationDateBefore: '2026-12-31',
        terminationDateAfter: '2026-01-01'
      };
      service.getTemplates(50, 25, params);
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/50/25',
        {
          donationType: 'DI',
          procedureCode: 'WB',
          templateId: 'TMPL001',
          physicalCode: 'ARMK',
          status: 'ACTIVE',
          showInactive: true,
          searchText: 'test',
          sortDirection: 'ASC',
          sortColumn: 'templateId',
          effectiveDateBefore: '2025-12-31',
          effectiveDateAfter: '2025-01-01',
          terminationDateBefore: '2026-12-31',
          terminationDateAfter: '2026-01-01'
        }
      );
    });

    it('should map searchKeyword to searchText and sort to sortDirection', () => {
      service.getTemplates(10, 0, { searchKeyword: 'search term', sort: 'DESC' });
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[1]).toEqual(jasmine.objectContaining({
        searchText: 'search term',
        sortDirection: 'DESC'
      }));
    });
  });

  describe('getTemplateDetails', () => {
    it('should include procedureCode in URL when provided', () => {
      service.getTemplateDetails('TMPL002', 'AU', 'PLT');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        `/api/v1/physical-findings-templates/TMPL002?chapterId=${mockChapterId}&donationType=AU&procedureCode=PLT`
      );
    });

    it('should omit procedureCode in URL when null', () => {
      service.getTemplateDetails('TMPL002', 'AU', null);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        `/api/v1/physical-findings-templates/TMPL002?chapterId=${mockChapterId}&donationType=AU`
      );
    });

    it('should omit procedureCode in URL when undefined', () => {
      service.getTemplateDetails('TMPL002', 'AU');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        `/api/v1/physical-findings-templates/TMPL002?chapterId=${mockChapterId}&donationType=AU`
      );
    });

    it('should encode special characters in templateId and donationType', () => {
      service.getTemplateDetails('TMPL/001', 'D&I', 'W B');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        `/api/v1/physical-findings-templates/TMPL%2F001?chapterId=${mockChapterId}&donationType=D%26I&procedureCode=W%20B`
      );
    });
  });

  describe('getTemplateList', () => {
    it('should omit procedureCode when null', () => {
      service.getTemplateList('DI', null);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/templates?donationType=DI'
      );
    });

    it('should omit procedureCode when undefined', () => {
      service.getTemplateList('DI');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/templates?donationType=DI'
      );
    });
  });

  describe('getAllProcedureCodes', () => {
    it('should call with default params', () => {
      service.getAllProcedureCodes();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?showInactive=false&forFilter=false'
      );
    });

    it('should call with showInactive true', () => {
      service.getAllProcedureCodes(true);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?showInactive=true&forFilter=false'
      );
    });

    it('should call with forFilter true', () => {
      service.getAllProcedureCodes(false, true);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?showInactive=false&forFilter=true'
      );
    });

    it('should call with both showInactive and forFilter true', () => {
      service.getAllProcedureCodes(true, true);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?showInactive=true&forFilter=true'
      );
    });
  });

  describe('getAddDropdowns', () => {
    it('should map donation types from API response', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'DI', description: 'Directed' },
          { code: 'AU', description: 'Autologous' }
        ],
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAddDropdowns().subscribe({
        next: (result) => {
          expect(result.donationTypes).toEqual([
            { key: 'Directed', value: 'DI' },
            { key: 'Autologous', value: 'AU' }
          ]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty data array', (done) => {
      const mockResponse = { success: true, data: [], statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAddDropdowns().subscribe({
        next: (result) => {
          expect(result.donationTypes).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle null data in response', (done) => {
      const mockResponse = { success: true, data: null, statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(mockResponse as any));

      service.getAddDropdowns().subscribe({
        next: (result) => {
          expect(result.donationTypes).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate errors from getDonationTypes', (done) => {
      const mockError = new Error('Network error');
      apiServiceSpy.get.and.returnValue(new Observable(subscriber => subscriber.error(mockError)));

      service.getAddDropdowns().subscribe({
        next: () => done.fail('should have errored'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getPhysicalCodesByRules', () => {
    it('should call with donationType and procedureCode', () => {
      service.getPhysicalCodesByRules('DI', 'WB');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/physical-codes/by-rules?donationType=DI&procedureCode=WB'
      );
    });

    it('should call with donationType only (no procedureCode)', () => {
      service.getPhysicalCodesByRules('DI');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/physical-codes/by-rules?donationType=DI'
      );
    });

    it('should call with donationType and null procedureCode', () => {
      service.getPhysicalCodesByRules('DI', null);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/physical-codes/by-rules?donationType=DI'
      );
    });
  });

  describe('getAvailablePhysicalCodes', () => {
    it('should use getPhysicalCodesByRules when donationType is provided', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'ARMK', description: 'Arm Check', boxNumber: 1, dataType: 'C' }
        ],
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAvailablePhysicalCodes('DI', 'WB').subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            '/api/v1/physical-findings-templates/physical-codes/by-rules?donationType=DI&procedureCode=WB'
          );
          expect(result.data).toEqual([
            { physicalCode: 'ARMK', description: 'Arm Check', boxNumber: 1, dataType: 'C' }
          ]);
          done();
        },
        error: done.fail
      });
    });

    it('should use getPhysicalCodes when donationType is not provided', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'TEMP', description: 'Temperature', boxNumber: 2, dataType: 'N' }
        ],
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAvailablePhysicalCodes().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            '/api/v1/physical-findings-templates/physical-codes'
          );
          expect(result.data).toEqual([
            { physicalCode: 'TEMP', description: 'Temperature', boxNumber: 2, dataType: 'N' }
          ]);
          done();
        },
        error: done.fail
      });
    });

    it('should default boxNumber to null and dataType to empty string when missing', (done) => {
      const mockResponse = {
        success: true,
        data: [{ code: 'BP', description: 'Blood Pressure' }],
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAvailablePhysicalCodes('DI').subscribe({
        next: (result) => {
          expect(result.data[0].boxNumber).toBeNull();
          expect(result.data[0].dataType).toBe('');
          done();
        },
        error: done.fail
      });
    });

    it('should handle null data in response', (done) => {
      const mockResponse = { success: true, data: null, statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(mockResponse as any));

      service.getAvailablePhysicalCodes('DI').subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate errors', (done) => {
      const mockError = new Error('Server error');
      apiServiceSpy.get.and.returnValue(new Observable(subscriber => subscriber.error(mockError)));

      service.getAvailablePhysicalCodes('DI').subscribe({
        next: () => done.fail('should have errored'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });

    it('should use getPhysicalCodes when donationType is empty string', (done) => {
      const mockResponse = { success: true, data: [], statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAvailablePhysicalCodes('').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            '/api/v1/physical-findings-templates/physical-codes'
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('createTemplate', () => {
    it('should include resolveOverlaps when set to true', () => {
      const createDto = {
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: new Date('2025-01-01'),
        terminationDate: null,
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }],
        resolveOverlaps: true
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[1]).toEqual(jasmine.objectContaining({
        resolveOverlaps: true
      }));
    });

    it('should default resolveOverlaps to false when not provided', () => {
      const createDto = {
        donationType: 'DI',
        procedureCode: null,
        effectiveDate: new Date(),
        physicalCodes: [{ physicalCode: 'TEMP', sortSequence: 1 }]
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[1]).toEqual(jasmine.objectContaining({
        resolveOverlaps: false,
        procedureCode: null
      }));
    });

    it('should map physicalCodes with dataType', () => {
      const createDto = {
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: new Date(),
        physicalCodes: [
          { physicalCode: 'ARMK', sortSequence: 1, dataType: 'C' },
          { physicalCode: 'TEMP', sortSequence: 2, dataType: 'N' }
        ]
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[1].physicalCodes).toEqual([
        { physicalCode: 'ARMK', sortSequence: 1, dataType: 'C' },
        { physicalCode: 'TEMP', sortSequence: 2, dataType: 'N' }
      ]);
    });

    it('should default dataType to null when not provided in physicalCodes', () => {
      const createDto = {
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: new Date(),
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[1].physicalCodes[0].dataType).toBeNull();
    });

    it('should pass HttpContext with SKIP_ERROR_TOAST for 409', () => {
      const createDto = {
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: new Date(),
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[2]).toBeDefined();
      expect(call.args[2].context).toBeDefined();
    });

    it('should use correct API endpoint', () => {
      const createDto = {
        donationType: 'AU',
        procedureCode: null,
        effectiveDate: new Date(),
        physicalCodes: [{ physicalCode: 'BP', sortSequence: 1 }]
      };

      service.createTemplate(createDto);
      const call = apiServiceSpy.post.calls.mostRecent();
      expect(call.args[0]).toBe('/api/v1/physical-findings-templates');
    });
  });

  describe('updateTemplate', () => {
    it('should include effectiveDate as ISO string when provided as Date', () => {
      const effDate = new Date('2025-06-15T00:00:00Z');
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: effDate,
        terminationDate: null,
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['effDate']).toBe(effDate.toISOString());
    });

    it('should include effectiveDate as ISO string when provided as string', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: '2025-06-15',
        terminationDate: null,
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['effDate']).toBeDefined();
      expect(typeof call.args[1]['effDate']).toBe('string');
    });

    it('should not include effDate when effectiveDate is not provided', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['effDate']).toBeUndefined();
    });

    it('should include terminationDate as ISO string when provided as Date', () => {
      const termDate = new Date('2026-12-31T00:00:00Z');
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: new Date(),
        terminationDate: termDate,
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['termDate']).toBe(termDate.toISOString());
    });

    it('should include terminationDate as ISO string when provided as string', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        terminationDate: '2026-12-31',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['termDate']).toBeDefined();
      expect(typeof call.args[1]['termDate']).toBe('string');
    });

    it('should set termDate to null when terminationDate is null', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        terminationDate: null,
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['termDate']).toBeNull();
    });

    it('should set termDate to null when terminationDate is undefined', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['termDate']).toBeNull();
    });

    it('should set resolveOverlaps to true when provided', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }],
        resolveOverlaps: true
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['resolveOverlaps']).toBe(true);
    });

    it('should map physicalCodes with auditKey', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [
          { physicalCode: 'ARMK', sortSequence: 1, dataType: 'C', auditKey: 123 },
          { physicalCode: 'TEMP', sortSequence: 2, auditKey: 456 }
        ]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['physicalCodes']).toEqual([
        { physicalCode: 'ARMK', sortSequence: 1, dataType: 'C', auditKey: 123 },
        { physicalCode: 'TEMP', sortSequence: 2, dataType: null, auditKey: 456 }
      ]);
    });

    it('should default auditKey to null when not provided', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[1]['physicalCodes'][0].auditKey).toBeNull();
    });

    it('should use correct URL with encoded templateId', () => {
      const updateDto = {
        templateId: 'TMPL/001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[0]).toBe('/api/v1/physical-findings-templates/TMPL%2F001');
    });

    it('should pass HttpContext with SKIP_ERROR_TOAST for 409', () => {
      const updateDto = {
        templateId: 'TMPL001',
        donationType: 'DI',
        procedureCode: 'WB',
        physicalCodes: [{ physicalCode: 'ARMK', sortSequence: 1 }]
      };

      service.updateTemplate(updateDto);
      const call = apiServiceSpy.put.calls.mostRecent();
      expect(call.args[2]).toBeDefined();
      expect(call.args[2].context).toBeDefined();
    });
  });

  describe('updateTerminationDate', () => {
    it('should pass terminationDate as-is when it is a string', () => {
      const updateDto = {
        templateIds: ['TMPL001'],
        donationType: 'DI',
        procedureCode: 'WB',
        terminationDate: '2026-12-31T00:00:00.000Z'
      };

      service.updateTerminationDate(updateDto);
      const call = apiServiceSpy.patch.calls.mostRecent();
      expect(call.args[1]).toEqual({ termDate: '2026-12-31T00:00:00.000Z' });
    });

    it('should convert Date to ISO string for terminationDate', () => {
      const termDate = new Date('2026-12-31T00:00:00Z');
      const updateDto = {
        templateIds: ['TMPL002'],
        donationType: 'AU',
        procedureCode: null,
        terminationDate: termDate
      };

      service.updateTerminationDate(updateDto);
      const call = apiServiceSpy.patch.calls.mostRecent();
      expect(call.args[1]).toEqual({ termDate: termDate.toISOString() });
    });

    it('should omit procedureCode from URL when null', () => {
      const updateDto = {
        templateIds: ['TMPL001'],
        donationType: 'DI',
        procedureCode: null,
        terminationDate: new Date()
      };

      service.updateTerminationDate(updateDto);
      const call = apiServiceSpy.patch.calls.mostRecent();
      expect(call.args[0]).toBe(
        `/api/v1/physical-findings-templates/TMPL001/term-date?chapterId=${mockChapterId}&donationType=DI`
      );
    });

    it('should use the first templateId from the array', () => {
      const updateDto = {
        templateIds: ['FIRST', 'SECOND'],
        donationType: 'DI',
        procedureCode: 'WB',
        terminationDate: new Date()
      };

      service.updateTerminationDate(updateDto);
      const call = apiServiceSpy.patch.calls.mostRecent();
      expect(call.args[0]).toContain('/FIRST/term-date');
    });
  });

  describe('batchUpdateTerminationDate', () => {
    it('should call patch with correct endpoint and payload', () => {
      const batchDto = {
        chapterId: 'TEST',
        items: [
          { templateId: 'TMPL001', donationType: 'DI', procedureCode: 'WB', termDate: '2026-12-31' },
          { templateId: 'TMPL002', donationType: 'AU', procedureCode: null, termDate: '2026-06-30' }
        ]
      };

      service.batchUpdateTerminationDate(batchDto);
      expect(apiServiceSpy.patch).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/batch/term-date',
        batchDto
      );
    });

    it('should call patch with empty items array', () => {
      const batchDto = { chapterId: 'TEST', items: [] };

      service.batchUpdateTerminationDate(batchDto);
      expect(apiServiceSpy.patch).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/batch/term-date',
        batchDto
      );
    });
  });

  describe('deletePhysicalCode', () => {
    it('should omit procedureCode from URL when null', () => {
      service.deletePhysicalCode('TMPL001', 'ARMK', 'DI', null);
      expect(apiServiceSpy.delete).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/TMPL001/ARMK?donationType=DI'
      );
    });

    it('should omit procedureCode from URL when undefined', () => {
      service.deletePhysicalCode('TMPL001', 'ARMK', 'DI');
      expect(apiServiceSpy.delete).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/TMPL001/ARMK?donationType=DI'
      );
    });

    it('should encode special characters in path params', () => {
      service.deletePhysicalCode('TMPL/001', 'ARM K', 'D&I', 'W B');
      expect(apiServiceSpy.delete).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/TMPL%2F001/ARM%20K?donationType=D%26I&procedureCode=W%20B'
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should return a message indicating not implemented', (done) => {
      const consoleSpy = spyOn(console, 'warn');

      service.deleteTemplate('TMPL001', 'DI', null).subscribe({
        next: (result) => {
          expect(result.message).toBe('Not implemented');
          expect(consoleSpy).toHaveBeenCalledWith(
            'deleteTemplate is deprecated. Use deletePhysicalCode instead.'
          );
          done();
        },
        error: done.fail
      });
    });

    it('should complete the observable after emitting', (done) => {
      spyOn(console, 'warn');
      let completed = false;

      service.deleteTemplate('TMPL001', 'DI', 'WB').subscribe({
        next: () => {},
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getDonationTypes', () => {
    it('should call with both showInactive and forFilter true', () => {
      service.getDonationTypes(true, true);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/donation-types?showInactive=true&forFilter=true'
      );
    });
  });

  describe('getProcedureCodes', () => {
    it('should call with both showInactive and forFilter true', () => {
      service.getProcedureCodes('AU', true, true);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?donationType=AU&showInactive=true&forFilter=true'
      );
    });

    it('should encode special characters in donationType', () => {
      service.getProcedureCodes('D&I');
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/physical-findings-templates/procedure-codes?donationType=D%26I&showInactive=false&forFilter=false'
      );
    });
  });
});
