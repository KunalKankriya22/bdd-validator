import { Observable } from 'rxjs';
import {
  MasterCodeDto,
  ValidTestDto,
  StateDto,
  CountryDto,
  ChapterDto
} from '../models/lookup.model';

/**
 * Lookup Repository Interface
 * Defines the contract for fetching lookup/reference data from the API
 * Used for dropdowns, autocompletes, and validation lists throughout the application
 */
export interface ILookupRepository {
  /**
   * Get master codes by code type
   * Returns all active codes for a specific code type category
   *
   * @param codeType - Code type identifier (e.g., 'STATE', 'DRVTY', 'CNTRY')
   * @param activeOnly - If true, only return codes where current date is between EFF_DATE and TERM_DATE
   * @returns Observable array of master code DTOs
   */
  getMasterCodesByType(codeType: string, activeOnly?: boolean): Observable<MasterCodeDto[]>;

  /**
   * Get a specific master code by type and code value
   * Used for validation and detail lookups
   *
   * @param codeType - Code type identifier
   * @param code - Specific code value to fetch
   * @returns Observable of single master code DTO or null if not found
   */
  getMasterCode(codeType: string, code: string): Observable<MasterCodeDto | null>;

  /**
   * Get all valid tests
   * Returns laboratory tests available in the system
   *
   * @param activeOnly - If true, only return tests where current date is between EFF_DATE and TERM_DATE
   * @param testGroup - Optional filter by test group category
   * @returns Observable array of valid test DTOs
   */
  getValidTests(activeOnly?: boolean, testGroup?: string): Observable<ValidTestDto[]>;

  /**
   * Get a specific valid test by test ID
   *
   * @param testId - Unique test identifier
   * @returns Observable of single valid test DTO or null if not found
   */
  getValidTest(testId: string): Observable<ValidTestDto | null>;

  /**
   * Get all states
   * Returns US states and territories for address forms
   *
   * @param countryCode - Optional filter by country (default 'USA')
   * @returns Observable array of state DTOs
   */
  getStates(countryCode?: string): Observable<StateDto[]>;

  /**
   * Get a specific state by code
   *
   * @param stateCode - Two-letter state code
   * @returns Observable of single state DTO or null if not found
   */
  getState(stateCode: string): Observable<StateDto | null>;

  /**
   * Get all countries
   * Returns countries for international address support
   *
   * @param activeOnly - If true, only return active countries
   * @returns Observable array of country DTOs
   */
  getCountries(activeOnly?: boolean): Observable<CountryDto[]>;

  /**
   * Get a specific country by code
   *
   * @param countryCode - Country code
   * @returns Observable of single country DTO or null if not found
   */
  getCountry(countryCode: string): Observable<CountryDto | null>;

  /**
   * Get all chapters
   * Returns blood center chapters/organizations
   *
   * @param activeOnly - If true, only return active chapters
   * @returns Observable array of chapter DTOs
   */
  getChapters(activeOnly?: boolean): Observable<ChapterDto[]>;

  /**
   * Get a specific chapter by ID
   *
   * @param chapterId - Unique chapter identifier
   * @returns Observable of single chapter DTO or null if not found
   */
  getChapter(chapterId: string): Observable<ChapterDto | null>;

  /**
   * Search master codes
   * Search across code and description fields for a given code type
   *
   * @param codeType - Code type identifier
   * @param searchTerm - Search string to match against code or description
   * @param activeOnly - If true, only return active codes
   * @returns Observable array of matching master code DTOs
   */
  searchMasterCodes(
    codeType: string,
    searchTerm: string,
    activeOnly?: boolean
  ): Observable<MasterCodeDto[]>;

  /**
   * Search valid tests
   * Search across test ID and description fields
   *
   * @param searchTerm - Search string to match against test ID or description
   * @param activeOnly - If true, only return active tests
   * @param testGroup - Optional filter by test group
   * @returns Observable array of matching valid test DTOs
   */
  searchValidTests(
    searchTerm: string,
    activeOnly?: boolean,
    testGroup?: string
  ): Observable<ValidTestDto[]>;
}
