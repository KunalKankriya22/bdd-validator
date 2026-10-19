import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { LoggingService } from '../services/logging.service';
import { ILookupRepository } from './lookup-repository.interface';
import {
  MasterCodeDto,
  ValidTestDto,
  StateDto,
  CountryDto,
  ChapterDto
} from '../models/lookup.model';

/**
 * Lookup Repository Implementation
 * Concrete implementation of ILookupRepository for fetching reference data from the API
 * Follows the repository pattern to abstract data access logic
 */
@Injectable({
  providedIn: 'root'
})
export class LookupRepository implements ILookupRepository {
  private readonly apiService = inject(ApiService);
  private readonly loggingService = inject(LoggingService);

  /**
   * Get master codes by code type
   * GET /api/v1/lookup/master-codes/{codeType}
   */
  getMasterCodesByType(codeType: string, activeOnly: boolean = true): Observable<MasterCodeDto[]> {
    const endpoint = `/api/v1/lookup/master-codes/${encodeURIComponent(codeType)}`;
    const params = activeOnly ? { activeOnly: 'true' } : undefined;

    this.loggingService.log(`Fetching master codes for type: ${codeType}`, { activeOnly });

    return this.apiService.get<MasterCodeDto[]>(endpoint, { params: params as any }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from master codes API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log(`Successfully fetched master codes for ${codeType}`, {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching master codes for ${codeType}`, error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific master code by type and code value
   * GET /api/v1/lookup/master-codes/{codeType}/{code}
   */
  getMasterCode(codeType: string, code: string): Observable<MasterCodeDto | null> {
    const endpoint = `/api/v1/lookup/master-codes/${encodeURIComponent(codeType)}/${encodeURIComponent(code)}`;

    this.loggingService.log(`Fetching master code: ${codeType}/${code}`);

    return this.apiService.get<MasterCodeDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched master code: ${codeType}/${code}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching master code: ${codeType}/${code}`, error);
        return of(null);
      })
    );
  }

  /**
   * Get all valid tests
   * GET /api/v1/lookup/valid-tests
   */
  getValidTests(activeOnly: boolean = true, testGroup?: string): Observable<ValidTestDto[]> {
    const endpoint = '/api/v1/lookup/valid-tests';
    const params: any = {};

    if (activeOnly) {
      params.activeOnly = 'true';
    }
    if (testGroup) {
      params.testGroup = testGroup;
    }

    this.loggingService.log('Fetching valid tests', { activeOnly, testGroup });

    return this.apiService.get<ValidTestDto[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from valid tests API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully fetched valid tests', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching valid tests', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific valid test by test ID
   * GET /api/v1/lookup/valid-tests/{testId}
   */
  getValidTest(testId: string): Observable<ValidTestDto | null> {
    const endpoint = `/api/v1/lookup/valid-tests/${encodeURIComponent(testId)}`;

    this.loggingService.log(`Fetching valid test: ${testId}`);

    return this.apiService.get<ValidTestDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched valid test: ${testId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching valid test: ${testId}`, error);
        return of(null);
      })
    );
  }

  /**
   * Get all states
   * GET /api/v1/lookup/states
   */
  getStates(countryCode: string = 'USA'): Observable<StateDto[]> {
    const endpoint = '/api/v1/lookup/states';
    const params = countryCode ? { countryCode } : undefined;

    this.loggingService.log('Fetching states', { countryCode });

    return this.apiService.get<StateDto[]>(endpoint, { params: params as any }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from states API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully fetched states', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching states', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific state by code
   * GET /api/v1/lookup/states/{stateCode}
   */
  getState(stateCode: string): Observable<StateDto | null> {
    const endpoint = `/api/v1/lookup/states/${encodeURIComponent(stateCode)}`;

    this.loggingService.log(`Fetching state: ${stateCode}`);

    return this.apiService.get<StateDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched state: ${stateCode}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching state: ${stateCode}`, error);
        return of(null);
      })
    );
  }

  /**
   * Get all countries
   * GET /api/v1/lookup/countries
   */
  getCountries(activeOnly: boolean = true): Observable<CountryDto[]> {
    const endpoint = '/api/v1/lookup/countries';
    const params = activeOnly ? { activeOnly: 'true' } : undefined;

    this.loggingService.log('Fetching countries', { activeOnly });

    return this.apiService.get<CountryDto[]>(endpoint, { params: params as any }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from countries API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully fetched countries', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching countries', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific country by code
   * GET /api/v1/lookup/countries/{countryCode}
   */
  getCountry(countryCode: string): Observable<CountryDto | null> {
    const endpoint = `/api/v1/lookup/countries/${encodeURIComponent(countryCode)}`;

    this.loggingService.log(`Fetching country: ${countryCode}`);

    return this.apiService.get<CountryDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched country: ${countryCode}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching country: ${countryCode}`, error);
        return of(null);
      })
    );
  }

  /**
   * Get all chapters
   * GET /api/v1/lookup/chapters
   */
  getChapters(activeOnly: boolean = true): Observable<ChapterDto[]> {
    const endpoint = activeOnly ? '/api/v1/chapters/active/lookup' : '/api/v1/lookup/chapters';

    this.loggingService.log('Fetching chapters', { activeOnly });

    return this.apiService.get<ChapterDto[]>(endpoint).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from chapters API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully fetched chapters', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching chapters', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific chapter by ID
   * GET /api/v1/lookup/chapters/{chapterId}
   */
  getChapter(chapterId: string): Observable<ChapterDto | null> {
    const endpoint = `/api/v1/lookup/chapters/${encodeURIComponent(chapterId)}`;

    this.loggingService.log(`Fetching chapter: ${chapterId}`);

    return this.apiService.get<ChapterDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched chapter: ${chapterId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching chapter: ${chapterId}`, error);
        return of(null);
      })
    );
  }

  /**
   * Search master codes
   * GET /api/v1/lookup/master-codes/{codeType}/search
   */
  searchMasterCodes(
    codeType: string,
    searchTerm: string,
    activeOnly: boolean = true
  ): Observable<MasterCodeDto[]> {
    const endpoint = `/api/v1/lookup/master-codes/${encodeURIComponent(codeType)}/search`;
    const params: any = { q: searchTerm };

    if (activeOnly) {
      params.activeOnly = 'true';
    }

    this.loggingService.log(`Searching master codes for type: ${codeType}`, {
      searchTerm,
      activeOnly
    });

    return this.apiService.get<MasterCodeDto[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from master codes search API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log(`Successfully searched master codes for ${codeType}`, {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error searching master codes for ${codeType}`, error);
        return of([]);
      })
    );
  }

  /**
   * Search valid tests
   * GET /api/v1/lookup/valid-tests/search
   */
  searchValidTests(
    searchTerm: string,
    activeOnly: boolean = true,
    testGroup?: string
  ): Observable<ValidTestDto[]> {
    const endpoint = '/api/v1/lookup/valid-tests/search';
    const params: any = { q: searchTerm };

    if (activeOnly) {
      params.activeOnly = 'true';
    }
    if (testGroup) {
      params.testGroup = testGroup;
    }

    this.loggingService.log('Searching valid tests', {
      searchTerm,
      activeOnly,
      testGroup
    });

    return this.apiService.get<ValidTestDto[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from valid tests search API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully searched valid tests', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error searching valid tests', error);
        return of([]);
      })
    );
  }
}
