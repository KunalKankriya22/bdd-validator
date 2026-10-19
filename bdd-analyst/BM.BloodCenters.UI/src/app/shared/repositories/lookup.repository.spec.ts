import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LookupRepository } from './lookup.repository';
import { ApiService } from '../services/api.service';
import { LoggingService } from '../services/logging.service';
import {
  MasterCodeDto,
  ValidTestDto,
  StateDto,
  CountryDto,
  ChapterDto
} from '../models/lookup.model';

describe('LookupRepository', () => {
  let repository: LookupRepository;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);

    TestBed.configureTestingModule({
      providers: [
        LookupRepository,
        { provide: ApiService, useValue: apiSpy },
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });

    repository = TestBed.inject(LookupRepository);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  describe('getMasterCodesByType', () => {
    it('should fetch master codes by type', (done) => {
      const mockCodes: MasterCodeDto[] = [
        {
          codeType: 'STATE',
          code: 'NY',
          description: 'New York',
          effDate: '2020-01-01T00:00:00Z',
          termDate: null
        },
        {
          codeType: 'STATE',
          code: 'CA',
          description: 'California',
          effDate: '2020-01-01T00:00:00Z',
          termDate: null
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockCodes));

      repository.getMasterCodesByType('STATE').subscribe(codes => {
        expect(codes).toEqual(mockCodes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/master-codes/STATE',
          { params: { activeOnly: 'true' } as any }
        );
        expect(loggingServiceSpy.log).toHaveBeenCalled();
        done();
      });
    });


    it('should handle activeOnly parameter', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      repository.getMasterCodesByType('STATE', false).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/master-codes/STATE',
          { params: undefined }
        );
        done();
      });
    });
  });

  describe('getMasterCode', () => {
    it('should fetch a specific master code', (done) => {
      const mockCode: MasterCodeDto = {
        codeType: 'STATE',
        code: 'NY',
        description: 'New York',
        effDate: '2020-01-01T00:00:00Z',
        termDate: null
      };

      apiServiceSpy.get.and.returnValue(of(mockCode));

      repository.getMasterCode('STATE', 'NY').subscribe(code => {
        expect(code).toEqual(mockCode);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/master-codes/STATE/NY');
        done();
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not Found')));

      repository.getMasterCode('STATE', 'XX').subscribe(code => {
        expect(code).toBeNull();
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getValidTests', () => {
    it('should fetch valid tests', (done) => {
      const mockTests: ValidTestDto[] = [
        {
          testId: 'ABO',
          testDesc: 'ABO Blood Type',
          testGroup: 'IMMUNO',
          effDate: '2020-01-01T00:00:00Z',
          termDate: null
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockTests));

      repository.getValidTests().subscribe(tests => {
        expect(tests).toEqual(mockTests);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/valid-tests',
          jasmine.objectContaining({ params: jasmine.objectContaining({ activeOnly: 'true' }) })
        );
        done();
      });
    });

    it('should handle test group filter', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      repository.getValidTests(true, 'IMMUNO').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/valid-tests',
          jasmine.objectContaining({ params: jasmine.objectContaining({ activeOnly: 'true', testGroup: 'IMMUNO' }) })
        );
        done();
      });
    });

  });

  describe('getValidTest', () => {
    it('should fetch a specific valid test', (done) => {
      const mockTest: ValidTestDto = {
        testId: 'ABO',
        testDesc: 'ABO Blood Type',
        testGroup: 'IMMUNO',
        effDate: '2020-01-01T00:00:00Z',
        termDate: null
      };

      apiServiceSpy.get.and.returnValue(of(mockTest));

      repository.getValidTest('ABO').subscribe(test => {
        expect(test).toEqual(mockTest);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/valid-tests/ABO');
        done();
      });
    });

  });

  describe('getStates', () => {
    it('should fetch states with default country code', (done) => {
      const mockStates: StateDto[] = [
        { code: 'NY', description: 'New York' },
        { code: 'CA', description: 'California' }
      ];

      apiServiceSpy.get.and.returnValue(of(mockStates));

      repository.getStates().subscribe(states => {
        expect(states).toEqual(mockStates);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/states',
          { params: { countryCode: 'USA' } as any }
        );
        done();
      });
    });

    it('should handle custom country code', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      repository.getStates('CAN').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/states',
          { params: { countryCode: 'CAN' } as any }
        );
        done();
      });
    });
  });

  describe('getState', () => {
    it('should fetch a specific state', (done) => {
      const mockState: StateDto = { code: 'NY', description: 'New York' };

      apiServiceSpy.get.and.returnValue(of(mockState));

      repository.getState('NY').subscribe(state => {
        expect(state).toEqual(mockState);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/states/NY');
        done();
      });
    });
  });

  describe('getCountries', () => {
    it('should fetch countries', (done) => {
      const mockCountries: CountryDto[] = [
        { code: 'USA', description: 'United States' },
        { code: 'CAN', description: 'Canada' }
      ];

      apiServiceSpy.get.and.returnValue(of(mockCountries));

      repository.getCountries().subscribe(countries => {
        expect(countries).toEqual(mockCountries);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/countries',
          { params: { activeOnly: 'true' } as any }
        );
        done();
      });
    });
  });

  describe('getCountry', () => {
    it('should fetch a specific country', (done) => {
      const mockCountry: CountryDto = { code: 'USA', description: 'United States' };

      apiServiceSpy.get.and.returnValue(of(mockCountry));

      repository.getCountry('USA').subscribe(country => {
        expect(country).toEqual(mockCountry);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/countries/USA');
        done();
      });
    });
  });

  describe('getChapters', () => {
    it('should fetch active chapters', (done) => {
      const mockChapters: ChapterDto[] = [
        {
          chapterId: 'DAL',
          chapterName: 'Dallas Regional Blood Center',
          chapterTimezone: 'America/Chicago'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockChapters));

      repository.getChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockChapters);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/chapters/active/lookup');
        done();
      });
    });

    it('should handle activeOnly=false', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      repository.getChapters(false).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/chapters');
        done();
      });
    });
  });

  describe('getChapter', () => {
    it('should fetch a specific chapter', (done) => {
      const mockChapter: ChapterDto = {
        chapterId: 'DAL',
        chapterName: 'Dallas Regional Blood Center',
        chapterTimezone: 'America/Chicago'
      };

      apiServiceSpy.get.and.returnValue(of(mockChapter));

      repository.getChapter('DAL').subscribe(chapter => {
        expect(chapter).toEqual(mockChapter);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/lookup/chapters/DAL');
        done();
      });
    });
  });

  describe('searchMasterCodes', () => {
    it('should search master codes', (done) => {
      const mockResults: MasterCodeDto[] = [
        {
          codeType: 'STATE',
          code: 'NY',
          description: 'New York',
          effDate: '2020-01-01T00:00:00Z',
          termDate: null
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResults));

      repository.searchMasterCodes('STATE', 'New').subscribe(results => {
        expect(results).toEqual(mockResults);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/master-codes/STATE/search',
          jasmine.objectContaining({ params: jasmine.objectContaining({ q: 'New', activeOnly: 'true' }) })
        );
        done();
      });
    });

    it('should return empty array on search error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Search Error')));

      repository.searchMasterCodes('STATE', 'test').subscribe(results => {
        expect(results).toEqual([]);
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('searchValidTests', () => {
    it('should search valid tests', (done) => {
      const mockResults: ValidTestDto[] = [
        {
          testId: 'ABO',
          testDesc: 'ABO Blood Type',
          testGroup: 'IMMUNO',
          effDate: '2020-01-01T00:00:00Z',
          termDate: null
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResults));

      repository.searchValidTests('ABO').subscribe(results => {
        expect(results).toEqual(mockResults);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/valid-tests/search',
          jasmine.objectContaining({ params: jasmine.objectContaining({ q: 'ABO', activeOnly: 'true' }) })
        );
        done();
      });
    });

    it('should include test group in search', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      repository.searchValidTests('test', true, 'IMMUNO').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/valid-tests/search',
          jasmine.objectContaining({ params: jasmine.objectContaining({ q: 'test', activeOnly: 'true', testGroup: 'IMMUNO' }) })
        );
        done();
      });
    });
  });
});
