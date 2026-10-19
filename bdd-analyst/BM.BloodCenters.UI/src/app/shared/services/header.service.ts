import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, Subject } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { HeaderConfig, SystemUserResponse } from '../models/header.model';
import { environment } from '../../../environments/environment';
import { API } from '../../core/constants/api.constants';
import { LoginService } from './login.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ChapterTimezoneService } from './chapter-timezone.service';

/**
 * Service for managing header data
 */
@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private loginService = inject(LoginService);

  // SessionStorage keys for persisting chapter/warehouse data (tab-scoped)
  private readonly CHAPTER_ID_KEY = 'current_chapter_id';
  private readonly CHAPTER_NAME_KEY = 'current_chapter_name';
  private readonly WAREHOUSE_ID_KEY = 'current_warehouse_id';
  private readonly WAREHOUSE_NAME_KEY = 'current_warehouse_name';
  private readonly CHAPTER_TIMEZONE_KEY = 'current_chapter_timezone';
  private readonly CHAPTER_PRINT_HDR_KEY = 'current_chapter_print_hdr';
  private readonly USER_TESTING_LAB_CODE_KEY = 'current_user_testing_lab_code';
  private chapterTimezoneService = inject(ChapterTimezoneService);

  /**
   * Subject to notify components when chapter/warehouse changes
   */
  private chapterChangedSubject = new Subject<void>();
  public chapterChanged$ = this.chapterChangedSubject.asObservable();

  /**
   * Signal for header configuration
   */
  public headerConfig = signal<HeaderConfig>({
    title: 'Blood Centers',
    subtitle: 'Boston Children\'s Hospital',
    logoUrl: 'logo.png',
  });

  /**
   * Signal for database prefix
   */
  public databasePrefix = signal<string>('');

  /**
   * Signal for database name
   */
  public databaseName = signal<string>('');

  /**
   * Signal for chapter ID
   */
  public chapterId = signal<string>('');

  /**
   * Signal for chapter print header (tooltip text)
   */
  public chapterPrintHdr = signal<string>('');

  /**
   * Signal for warehouse ID
   */
  public warehouseId = signal<string>('');

   /**
   * Signal for warehouse Name
   */
  public warehouseName = signal<string>('');

   /**
   * Signal for Chapter Name
   */
  public chapterName = signal<string>('');

  /**
   * Signal for Chapter TimeZone
   * Empty until loaded from API or sessionStorage
   */
  public chapterTimeZone = signal<string>('');

  /**
   * Signal for user's testing lab code
   * Used to filter lab-specific data (test kits, reagents)
   */
  public userTestingLabCode = signal<string>('');

  /**
   * Signal for Institution Logo URL
   * Used to display institution logo in header-title-section
   */
  public institutionLogoUrl = signal<SafeUrl | string>('');

  /**
   * Constructor
   * @param http - Angular HttpClient for API calls
   * @param sanitizer - DomSanitizer for safe URL handling
   */
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Gets the current chapter ID
   * Common function to retrieve the current chapter ID from header context
   * @returns Current chapter ID as string
   */
  public getCurrentChapterId(): string {
    return this.chapterId();
  }

  /**
   * Gets the current warehouse ID
   * Common function to retrieve the current warehouse ID from header context
   * @returns Current warehouse ID as string
   */
  public getCurrentWarehouseId(): string {
    return this.warehouseId();
  }

  /**
   * Gets the current chapter name
   * Common function to retrieve the current chapter name from header context
   * @returns Current chapter name as string
   */
  public getCurrentChapterName(): string {
    return this.chapterName();
  }

  /**
   * Gets the current chapter timezone
   * Common function to retrieve the current chapter timezone from header context
   * @returns Current chapter timezone as string (e.g., '-06:00', 'America/Chicago')
   */
  public getCurrentChapterTimezone(): string {
    return this.chapterTimeZone();
  }

  /**
   * Gets the current logged-in username
   * Common function to retrieve the current username from login service
   * @returns Current username as string
   */
  public getCurrentUsername(): string {
    return this.loginService.getStoredUsername();
  }

  /**
   * Fetches system user data from the API
   * Also fetches chapter timezone information after loading user data
   * @param userId - User ID to fetch data for
   * @param preserveChapterWarehouse - If true, preserves existing chapter/warehouse session data
   * @returns Observable of SystemUserResponse
   */
  public fetchSystemUser(userId: string, preserveChapterWarehouse: boolean = false): Observable<SystemUserResponse> {
    const url = `${environment.apiUrl}${API.SYSTEM_USERS.GET_USER(userId)}`;

    return this.http.get<SystemUserResponse>(url).pipe(
      tap(response => {
        // Update header config with API response
        this.updateHeaderFromApiResponse(response, preserveChapterWarehouse);
      }),
      switchMap(response => {
        // After updating header, fetch chapter timezone with chapter ID
        const chapterId = response.chapterId || '';
        return this.chapterTimezoneService.fetchChapterTimezone(chapterId).pipe(
          catchError(() => {
            // Don't fail the entire operation if timezone fetch fails
            return of(null);
          }),
          // Map back to the original response
          switchMap(() => [response])
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches system user data by email (for Okta SSO login)
   * Also fetches chapter timezone information after loading user data
   * @param userEmail - User email to fetch data for
   * @param preserveChapterWarehouse - If true, preserves existing chapter/warehouse session data
   * @returns Observable of SystemUserResponse
   */
  public fetchSystemUserByEmail(userEmail: string, preserveChapterWarehouse: boolean = false): Observable<SystemUserResponse> {
    const url = `${environment.apiUrl}${API.SYSTEM_USERS.GET_USER_BY_EMAIL(userEmail)}`;

    return this.http.get<SystemUserResponse | SystemUserResponse[]>(url).pipe(
      map(response => {
        if (Array.isArray(response)) {
          if (response.length === 0) {
            throw new Error('No user found with the given email');
          }
          if (response.length > 1) {
            throw new Error('MULTIPLE_USERS_FOUND');
          }
          return response[0];
        }
        return response;
      }),
      tap(response => {
        if (response && !Array.isArray(response)) {
          this.updateHeaderFromApiResponse(response, preserveChapterWarehouse);
        }
      }),
      switchMap(response => {
        if (!response || Array.isArray(response)) {
          return of(response);
        }
        const chapterId = response.chapterId || '';
        return this.chapterTimezoneService.fetchChapterTimezone(chapterId).pipe(
          catchError(() => of(null)),
          switchMap(() => [response])
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Loads user data on initialization
   * Uses username from sessionStorage (stored after successful login)
   */
  public loadUserData(): void {
    this.loadFromSession();

    const userId = this.loginService.getStoredUsername();

    // If sessionStorage has chapter/warehouse data (page refresh) → preserve them, API only updates user info
    // If sessionStorage is empty (fresh login after logout) → API provides chapter/warehouse defaults
    const hasChapterData = !!sessionStorage.getItem(this.CHAPTER_ID_KEY) &&
                           !!sessionStorage.getItem(this.WAREHOUSE_ID_KEY);

    this.fetchSystemUser(userId, hasChapterData).subscribe({
      next: () => {
        this.loadInstitutionLogo();
      },
      error: () => {
        // Error already handled by handleError
      }
    });
  }

  /**
   * Loads institution logo from API
   * Always downloads inst_logo.png (standardized institution logo filename)
   */
  public loadInstitutionLogo(): void {
    // Always use standardized filename inst_logo.png
    this.downloadInstitutionLogo('inst_logo.png');
  }

  /**
   * Downloads institution logo file and sets it as safe URL
   * @param fileName - Name of the logo file to download (default: inst_logo.png)
   */
  private downloadInstitutionLogo(fileName: string = 'inst_logo.png'): void {
    if (!fileName) return;

    const apiUrl = `${environment.apiUrl}/api/v1/Auth/download/${fileName}`;

    this.http.get(apiUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.institutionLogoUrl.set(safeUrl);

        // Also update the headerConfig with institution logo
        this.headerConfig.update(current => ({
          ...current,
          institutionLogoUrl: safeUrl as string
        }));
      },
      error: () => {
        this.institutionLogoUrl.set('');
      }
    });
  }

  /**
   * Updates header configuration from API response
   * Preserves chapter/warehouse from session if user has previously changed them
   * @param response - System user API response
   * @param preserveChapterWarehouse - If true, preserves existing chapter/warehouse session data instead of overwriting with API defaults
   */
  public updateHeaderFromApiResponse(response: SystemUserResponse, preserveChapterWarehouse: boolean = false): void {
    // Update header config with API data
    this.headerConfig.update(current => ({
      ...current,
      user: {
        name: `${response.userFirstName} ${response.userLastName}`,
        id: response.userId,
        role: current.user?.role || 'User', // Keep existing role or default
        avatarUrl: current.user?.avatarUrl
      }
    }));

    // Update database signals
    this.databasePrefix.set(response.databasePrefix);
    this.databaseName.set(response.databaseName);

    // Lab code is always set from API response (not chapter-dependent)
    this.userTestingLabCode.set(response.labCode || '99');
    sessionStorage.setItem(this.USER_TESTING_LAB_CODE_KEY, response.labCode || '99');

    if (!preserveChapterWarehouse) {
      // Fresh login — API provides everything
      this.chapterId.set(response.chapterId);
      this.chapterPrintHdr.set(response.printHdr);
      this.warehouseId.set(response.warehouseId);
      this.warehouseName.set(response.warehouseName);
      this.chapterName.set(response.chapterName);
      this.chapterTimeZone.set(response.chapterTimezone || 'UTC');

      this.storeSession(
        response.chapterId,
        response.chapterName,
        response.warehouseId,
        response.warehouseName,
        response.chapterTimezone || 'UTC',
        response.printHdr || response.chapterName
      );
    }
    // Page refresh — everything preserved from session (loaded by loadFromSession)
  }

  /**
   * Updates chapter and warehouse information in the header
   * Also fetches updated chapter timezone information
   * @param chapterId - New chapter ID
   * @param chapterName - New chapter name
   * @param warehouseId - New warehouse ID
   * @param warehouseName - New warehouse name
   * @param chapterTimezone - New chapter timezone (optional)
   * @param chapterPrintHdr - Chapter print header/description (optional, defaults to chapterName if not provided)
   */
  public updateChapterAndWarehouse(
    chapterId: string,
    chapterName: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone?: string,
    chapterPrintHdr?: string
  ): void {
    this.chapterId.set(chapterId);
    this.chapterName.set(chapterName);
    this.warehouseId.set(warehouseId);
    this.warehouseName.set(warehouseName);
    if (chapterTimezone) {
      this.chapterTimeZone.set(chapterTimezone);
    }
    // Use chapterName as fallback if printHdr not provided (e.g., when changing chapters)
    const printHdr = chapterPrintHdr || chapterName;
    this.chapterPrintHdr.set(printHdr);

    // Store chapter/warehouse data in sessionStorage for persistence
    this.storeSession(
      chapterId,
      chapterName,
      warehouseId,
      warehouseName,
      chapterTimezone || this.chapterTimeZone(),
      printHdr
    );

    // Fetch updated chapter timezone for the new chapter
    this.chapterTimezoneService.fetchChapterTimezone(chapterId).subscribe();

    sessionStorage.removeItem('driveContext');
    sessionStorage.removeItem('labelPrinterContext');

    // Emit chapter changed event
    this.chapterChangedSubject.next();
  }

  /**
   * Updates the header configuration
   * @param config - New header configuration
   */
  public updateHeaderConfig(config: Partial<HeaderConfig>): void {
    this.headerConfig.update(current => ({
      ...current,
      ...config
    }));
  }

  /**
   * Store chapter/warehouse data in sessionStorage for persistence within the tab
   */
  private storeSession(
    chapterId: string,
    chapterName: string,
    warehouseId: string,
    warehouseName: string,
    chapterTimezone: string,
    chapterPrintHdr: string
  ): void {
    sessionStorage.setItem(this.CHAPTER_ID_KEY, chapterId);
    sessionStorage.setItem(this.CHAPTER_NAME_KEY, chapterName);
    sessionStorage.setItem(this.WAREHOUSE_ID_KEY, warehouseId);
    sessionStorage.setItem(this.WAREHOUSE_NAME_KEY, warehouseName);
    sessionStorage.setItem(this.CHAPTER_TIMEZONE_KEY, chapterTimezone);
    sessionStorage.setItem(this.CHAPTER_PRINT_HDR_KEY, chapterPrintHdr);
  }

  /**
   * Load chapter/warehouse data from sessionStorage on initialization
   * This restores the state after page refresh within the same tab
   */
  public loadFromSession(): void {
    const chapterId = sessionStorage.getItem(this.CHAPTER_ID_KEY);
    const chapterName = sessionStorage.getItem(this.CHAPTER_NAME_KEY);
    const warehouseId = sessionStorage.getItem(this.WAREHOUSE_ID_KEY);
    const warehouseName = sessionStorage.getItem(this.WAREHOUSE_NAME_KEY);
    const chapterTimezone = sessionStorage.getItem(this.CHAPTER_TIMEZONE_KEY);
    const chapterPrintHdr = sessionStorage.getItem(this.CHAPTER_PRINT_HDR_KEY);
    const userTestingLabCode = sessionStorage.getItem(this.USER_TESTING_LAB_CODE_KEY);

    if (chapterId) this.chapterId.set(chapterId);
    if (chapterName) this.chapterName.set(chapterName);
    if (warehouseId) this.warehouseId.set(warehouseId);
    if (warehouseName) this.warehouseName.set(warehouseName);
    if (chapterTimezone) this.chapterTimeZone.set(chapterTimezone);
    if (chapterPrintHdr) this.chapterPrintHdr.set(chapterPrintHdr);
    if (userTestingLabCode) this.userTestingLabCode.set(userTestingLabCode);
  }

  /**
   * Clear chapter/warehouse session data (e.g., on logout)
   */
  public clearSession(): void {
    sessionStorage.removeItem(this.CHAPTER_ID_KEY);
    sessionStorage.removeItem(this.CHAPTER_NAME_KEY);
    sessionStorage.removeItem(this.WAREHOUSE_ID_KEY);
    sessionStorage.removeItem(this.WAREHOUSE_NAME_KEY);
    sessionStorage.removeItem(this.CHAPTER_TIMEZONE_KEY);
    sessionStorage.removeItem(this.CHAPTER_PRINT_HDR_KEY);
    sessionStorage.removeItem(this.USER_TESTING_LAB_CODE_KEY);
  }

  /**
   * @deprecated Use clearSession() instead. Kept for backward compatibility.
   */
  public clearCookies(): void {
    this.clearSession();
  }

  /**
   * @deprecated Use loadFromSession() instead. Kept for backward compatibility.
   */
  public loadFromCookies(): void {
    this.loadFromSession();
  }

  /**
   * Handles HTTP errors
   * @param error - HTTP error response
   * @returns Observable that errors
   */
  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => error);
    }

    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
