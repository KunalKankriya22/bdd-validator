import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { ValidMasterCodesService, MasterCodeItem } from './valid-master-codes.service';
import { ApiService } from './api.service';
import { API } from '../../core/constants/api.constants';
import { CountryModel } from '../models/international-address.model';

describe('ValidMasterCodesService', () => {
  let service: ValidMasterCodesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockCountries: CountryModel[] = [
    { code: 'USA', description: 'United States' },
    { code: 'CAN', description: 'Canada' },
    { code: 'GBR', description: 'United Kingdom' },
  ];

  const mockCodes: MasterCodeItem[] = [
    { code: 'NY', description: 'New York' },
    { code: 'CA', description: 'California' },
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ValidMasterCodesService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ValidMasterCodesService);
  });

  // =============================================
  // getCountries
  // =============================================
  describe('getCountries', () => {
    it('should call the correct API endpoint', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries }));

      // Act
      service.getCountries().subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.INTERNATIONAL_ADDRESS.COUNTRIES);
        done();
      });
    });

    it('should return countries from response.data', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries }));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual(mockCountries);
        expect(countries.length).toBe(3);
        done();
      });
    });

    it('should return countries from response.Data when data is falsy', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ Data: mockCountries }));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual(mockCountries);
        done();
      });
    });

    it('should return empty array when neither data nor Data exist', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: null, Data: null }));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual([]);
        done();
      });
    });

    it('should cache results after first call', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries }));

      // Act - first call
      service.getCountries().subscribe(() => {
        // Act - second call
        service.getCountries().subscribe((countries) => {
          // Assert
          expect(countries).toEqual(mockCountries);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should prefer response.data over response.Data when both exist', (done) => {
      // Arrange
      const otherCountries: CountryModel[] = [{ code: 'MEX', description: 'Mexico' }];
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries, Data: otherCountries }));

      // Act
      service.getCountries().subscribe((countries) => {
        // Assert
        expect(countries).toEqual(mockCountries);
        done();
      });
    });
  });

  // =============================================
  // getByCodeType
  // =============================================
  describe('getByCodeType', () => {
    it('should call the correct API endpoint for given code type', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.LOOKUPS.BY_CODE_TYPE('STATE'),
          { params: undefined }
        );
        done();
      });
    });

    it('should pass searchKeyword as query param when provided', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE', 'New').subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.LOOKUPS.BY_CODE_TYPE('STATE'),
          { params: { searchKeyword: 'New' } as any }
        );
        done();
      });
    });

    it('should return codes from response.data', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe((codes) => {
        // Assert
        expect(codes).toEqual(mockCodes);
        expect(codes.length).toBe(2);
        done();
      });
    });

    it('should return codes from response.Data when data is falsy', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ Data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe((codes) => {
        // Assert
        expect(codes).toEqual(mockCodes);
        done();
      });
    });

    it('should return empty array when neither data nor Data exist', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      // Act
      service.getByCodeType('STATE').subscribe((codes) => {
        // Assert
        expect(codes).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getByCodeType('STATE').subscribe((codes) => {
        // Assert
        expect(codes).toEqual([]);
        done();
      });
    });

    it('should cache results per code type', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe(() => {
        service.getByCodeType('STATE').subscribe((codes) => {
          // Assert
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should cache separately for different code types', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe(() => {
        apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'FT', description: 'Full Time' }] }));
        service.getByCodeType('DRVTY').subscribe(() => {
          // Assert
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should use codeType:searchKeyword as cache key when searchKeyword is provided', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE', 'New').subscribe(() => {
        apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'CA', description: 'California' }] }));
        service.getByCodeType('STATE', 'Cal').subscribe(() => {
          // Assert - different searchKeyword = different cache key
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should use codeType alone as cache key when searchKeyword is not provided', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe(() => {
        service.getByCodeType('STATE').subscribe((codes) => {
          // Assert - same key, cached
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should cache separately when same codeType has different searchKeyword vs none', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act
      service.getByCodeType('STATE').subscribe(() => {
        apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'NY', description: 'New York' }] }));
        service.getByCodeType('STATE', 'New').subscribe(() => {
          // Assert - 'STATE' and 'STATE:New' are different cache keys
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  // =============================================
  // getCached - inflight deduplication
  // =============================================
  describe('getCached (inflight deduplication)', () => {
    it('should deduplicate concurrent requests for the same key', () => {
      // Arrange
      const subject = new Subject<any>();
      apiServiceSpy.get.and.returnValue(subject.asObservable());

      const results: MasterCodeItem[][] = [];

      // Act - subscribe twice before the first completes
      service.getByCodeType('STATE').subscribe((r) => results.push(r));
      service.getByCodeType('STATE').subscribe((r) => results.push(r));

      // Assert - fetchFn should only be called once
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);

      // Complete the request
      subject.next({ data: mockCodes });
      subject.complete();

      // Assert - both subscribers received the data
      expect(results.length).toBe(2);
      expect(results[0]).toEqual(mockCodes);
      expect(results[1]).toEqual(mockCodes);
    });

    it('should remove inflight entry after request completes and use cache for subsequent calls', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act - first call completes synchronously
      service.getByCodeType('STATE').subscribe(() => {
        // Act - second call should hit cache, not inflight
        service.getByCodeType('STATE').subscribe((codes) => {
          // Assert
          expect(codes).toEqual(mockCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should return cached data as observable on cache hit', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act - first call populates cache
      service.getByCodeType('STATE').subscribe(() => {
        // Act - second call should return from cache
        service.getByCodeType('STATE').subscribe((codes) => {
          // Assert
          expect(codes).toEqual(mockCodes);
          done();
        });
      });
    });
  });

  // =============================================
  // clearCache
  // =============================================
  describe('clearCache', () => {
    it('should clear specific cache key and force refetch', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries }));

      // Act - populate cache
      service.getCountries().subscribe(() => {
        // Act - clear the cache for CNTRY
        service.clearCache('CNTRY');

        // Act - next call should fetch again
        service.getCountries().subscribe(() => {
          // Assert
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should clear specific code type cache and force refetch', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      // Act - populate cache
      service.getByCodeType('STATE').subscribe(() => {
        // Act - clear the cache
        service.clearCache('STATE');

        // Act - next call should fetch again
        service.getByCodeType('STATE').subscribe(() => {
          // Assert
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should clear all caches when no key is provided', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: mockCountries }));

      // Act - populate cache
      service.getCountries().subscribe(() => {
        // Act - clear all caches
        service.clearCache();

        // Act - next call should fetch again
        service.getCountries().subscribe(() => {
          // Assert
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should clear inflight entries when clearing specific key', () => {
      // Arrange
      const subject = new Subject<any>();
      apiServiceSpy.get.and.returnValue(subject.asObservable());

      // Act - start request (stays inflight because Subject hasn't emitted)
      service.getByCodeType('STATE').subscribe();

      // Act - clear the inflight entry
      service.clearCache('STATE');

      // Act - new request should create a new inflight entry
      service.getByCodeType('STATE').subscribe();

      // Assert - fetchFn was called twice (inflight was cleared)
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear all inflight entries when no key is provided', () => {
      // Arrange
      const subject = new Subject<any>();
      apiServiceSpy.get.and.returnValue(subject.asObservable());

      // Act - start requests
      service.getByCodeType('STATE').subscribe();
      service.getCountries().subscribe();

      // Act - clear all
      service.clearCache();

      // Act - new requests
      service.getByCodeType('STATE').subscribe();
      service.getCountries().subscribe();

      // Assert - each endpoint was called twice
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(4);
    });

    it('should not throw when clearing a non-existent key', () => {
      // Arrange & Act & Assert
      expect(() => service.clearCache('nonexistent')).not.toThrow();
    });

    it('should not throw when clearing all with empty caches', () => {
      // Arrange & Act & Assert
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
