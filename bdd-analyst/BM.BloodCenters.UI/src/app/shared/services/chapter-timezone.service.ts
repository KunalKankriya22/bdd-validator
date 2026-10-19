import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import moment, { Moment } from 'moment';

/**
 * Response from the chapter timezone API
 */
export interface ChapterTimezoneResponse {
  chapterId: string;
  chapterLocalDate: string; // ISO format: "2026-04-04T00:00:00" (date only, truncated)
  chapterLocalDateTime?: string; // ISO format: "2026-04-04T14:30:00" (full date + time)
}

/**
 * Service to manage chapter local date/time
 * Calls the chapter timezone API to get the current date/time in the chapter's timezone
 */
@Injectable({
  providedIn: 'root'
})
export class ChapterTimezoneService {
  /**
   * Signal for chapter local date
   * This represents "today" in the chapter's timezone
   */
  public chapterLocalDate = signal<Moment | null>(null);

  /**
   * Signal for chapter local date/time (preserves time from API)
   */
  public chapterLocalDateTime = signal<Moment | null>(null);

  /**
   * Signal for chapter ID
   */
  public currentChapterId = signal<string>('');

  /**
   * Chapter's UTC offset in minutes (e.g. -300 for EST/UTC-5).
   * Computed when the timezone API responds by comparing the chapter-local
   * datetime the server returned with the actual UTC time at that moment.
   */
  private chapterUtcOffsetMinutes: number | null = null;

  /**
   * Wall-clock timestamp (Date.now()) when chapterLocalDateTime was captured.
   * Used to advance the snapshot to the current time on each read.
   */
  private chapterDateTimeSnapshotAt: number | null = null;

  private readonly API_ENDPOINT = '/api/v1/chapters/timezone';

  constructor(private http: HttpClient) {}

  /**
   * Fetch chapter timezone information from the API
   * Sends chapter ID in request headers as X-ChapterId
   * @param chapterId - The chapter ID to fetch timezone for
   * @returns Observable of ChapterTimezoneResponse
   */
  public fetchChapterTimezone(chapterId: string): Observable<ChapterTimezoneResponse> {
    const url = `${environment.apiUrl}${this.API_ENDPOINT}`;

    // Create headers with chapter ID (backend expects X-ChapterId)
    const headers = new HttpHeaders({
      'X-ChapterId': chapterId || ''
    });

    return this.http.get<ChapterTimezoneResponse>(url, { headers }).pipe(
      tap(response => {
        this.updateChapterLocalDate(response);
      })
    );
  }

  /**
   * Update the chapter local date from API response
   * @param response - Chapter timezone API response
   */
  private updateChapterLocalDate(response: ChapterTimezoneResponse): void {
    if (response.chapterLocalDate) {
      const dateOnly = moment(response.chapterLocalDate);
      this.chapterLocalDate.set(dateOnly.clone().startOf('day'));
      this.currentChapterId.set(response.chapterId);

      if (response.chapterLocalDateTime) {
        this.chapterLocalDateTime.set(moment(response.chapterLocalDateTime));
        this.chapterDateTimeSnapshotAt = Date.now();

        // Compute chapter UTC offset: parse the chapter-local string as if it
        // were UTC (strips browser offset), then diff against actual UTC now.
        // Result is the chapter's offset in minutes (e.g. -300 for UTC-5).
        const chapterLocalAsUtc = moment.utc(response.chapterLocalDateTime);
        const utcNow = moment.utc();
        this.chapterUtcOffsetMinutes = Math.round(chapterLocalAsUtc.diff(utcNow, 'minutes'));
      } else {
        this.chapterLocalDateTime.set(dateOnly);
      }
    }
  }

  /**
   * Get the current chapter local date
   * Returns the chapter's "today" or falls back to system date if not available
   * @returns Moment object representing today in the chapter's timezone
   */
  public getChapterLocalDate(): Moment {
    return this.getChapterLocalDateTime().clone().startOf('day');
  }

  /**
   * Get the current chapter local date and time
   * Advances the API snapshot by elapsed wall-clock time so the value
   * stays current even if the page has been open for hours.
   */
  public getChapterLocalDateTime(): Moment {
    const localDateTime = this.chapterLocalDateTime();
    if (localDateTime && localDateTime.isValid()) {
      if (this.chapterDateTimeSnapshotAt !== null) {
        const elapsed = Date.now() - this.chapterDateTimeSnapshotAt;
        return localDateTime.clone().add(elapsed, 'milliseconds');
      }
      return localDateTime.clone();
    }
    return moment();
  }

  /**
   * Check if chapter local date is available
   * @returns true if chapter local date has been loaded from API
   */
  public isChapterLocalDateAvailable(): boolean {
    const localDate = this.chapterLocalDate();
    return localDate !== null && localDate.isValid();
  }

  /**
   * Convert a chapter-local date/time to GMT.
   * Mirrors the API's UTIL.LIFETRACK_TIMEZONE_CONVERT.get_gmt_time() logic.
   * @param localDate - Moment representing a date/time in the chapter's timezone
   * @returns Moment in GMT
   */
  public convertLocalToGmt(localDate: Moment): Moment {
    if (this.chapterUtcOffsetMinutes !== null) {
      return localDate.clone().subtract(this.chapterUtcOffsetMinutes, 'minutes');
    }
    return localDate.clone().utc();
  }

  /**
   * Convert a GMT date/time to chapter-local time.
   * Mirrors the API's UTIL.LIFETRACK_TIMEZONE_CONVERT.get_local_time() logic.
   * @param gmtDate - Moment representing a date/time in GMT
   * @returns Moment in chapter-local time
   */
  public convertGmtToLocal(gmtDate: Moment): Moment {
    if (this.chapterUtcOffsetMinutes !== null) {
      return gmtDate.clone().add(this.chapterUtcOffsetMinutes, 'minutes');
    }
    return gmtDate.clone();
  }

  /**
   * Get the chapter's UTC offset in minutes, or null if not yet computed.
   */
  public getChapterUtcOffsetMinutes(): number | null {
    return this.chapterUtcOffsetMinutes;
  }

  /**
   * Clear chapter local date (used on logout)
   */
  public clearChapterLocalDate(): void {
    this.chapterLocalDate.set(null);
    this.chapterLocalDateTime.set(null);
    this.currentChapterId.set('');
    this.chapterUtcOffsetMinutes = null;
    this.chapterDateTimeSnapshotAt = null;
  }
}
