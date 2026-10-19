import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChapterTimezoneService, ChapterTimezoneResponse } from './chapter-timezone.service';
import { environment } from '../../../environments/environment';
import moment from 'moment';

describe('ChapterTimezoneService', () => {
  let service: ChapterTimezoneService;
  let httpMock: HttpTestingController;

  const API_URL = `${environment.apiUrl}/api/v1/chapters/timezone`;

  /** Helper: build a standard API response */
  function makeResponse(overrides: Partial<ChapterTimezoneResponse> = {}): ChapterTimezoneResponse {
    return {
      chapterId: 'CH01',
      chapterLocalDate: '2026-04-04T00:00:00',
      chapterLocalDateTime: '2026-04-04T14:30:00',
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChapterTimezoneService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ChapterTimezoneService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---- initial state ----

  describe('initial state', () => {
    it('should have null chapterLocalDate initially', () => {
      expect(service.chapterLocalDate()).toBeNull();
    });

    it('should have null chapterLocalDateTime initially', () => {
      expect(service.chapterLocalDateTime()).toBeNull();
    });

    it('should have empty currentChapterId initially', () => {
      expect(service.currentChapterId()).toBe('');
    });

    it('should have null chapterUtcOffsetMinutes initially', () => {
      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });
  });

  // ---- fetchChapterTimezone ----

  describe('fetchChapterTimezone', () => {
    it('should send GET with X-ChapterId header', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-ChapterId')).toBe('CH01');
      req.flush(makeResponse());
    });

    it('should send empty X-ChapterId when chapterId is empty', () => {
      service.fetchChapterTimezone('').subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('X-ChapterId')).toBe('');
      req.flush(makeResponse({ chapterId: '' }));
    });

    it('should send the chapterId value when it is a non-empty string', () => {
      service.fetchChapterTimezone('CH99').subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('X-ChapterId')).toBe('CH99');
      req.flush(makeResponse({ chapterId: 'CH99' }));
    });

    it('should update chapterLocalDate signal from response', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      httpMock.expectOne(API_URL).flush(makeResponse());

      const localDate = service.chapterLocalDate();
      expect(localDate).not.toBeNull();
      expect(localDate!.format('YYYY-MM-DD')).toBe('2026-04-04');
      // Should be start of day
      expect(localDate!.hour()).toBe(0);
      expect(localDate!.minute()).toBe(0);
    });

    it('should update chapterLocalDateTime signal from response', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      httpMock.expectOne(API_URL).flush(makeResponse());

      const localDateTime = service.chapterLocalDateTime();
      expect(localDateTime).not.toBeNull();
      expect(localDateTime!.format('YYYY-MM-DD HH:mm')).toBe('2026-04-04 14:30');
    });

    it('should update currentChapterId signal', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      expect(service.currentChapterId()).toBe('CH01');
    });

    it('should fall back to dateOnly for chapterLocalDateTime when chapterLocalDateTime is absent', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      httpMock.expectOne(API_URL).flush(makeResponse({ chapterLocalDateTime: undefined }));

      const dt = service.chapterLocalDateTime();
      expect(dt).not.toBeNull();
      // Falls back to the date-only value
      expect(dt!.format('YYYY-MM-DD')).toBe('2026-04-04');
    });

    it('should not update signals when chapterLocalDate is empty', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      httpMock.expectOne(API_URL).flush(makeResponse({ chapterLocalDate: '' }));

      expect(service.chapterLocalDate()).toBeNull();
    });

    it('should not update signals when chapterLocalDate is null-ish', () => {
      service.fetchChapterTimezone('CH01').subscribe();

      httpMock.expectOne(API_URL).flush(makeResponse({ chapterLocalDate: undefined as any }));

      expect(service.chapterLocalDate()).toBeNull();
    });

    it('should return the response as an observable', () => {
      const expectedResponse = makeResponse();
      let receivedResponse: ChapterTimezoneResponse | undefined;

      service.fetchChapterTimezone('CH01').subscribe(res => {
        receivedResponse = res;
      });

      httpMock.expectOne(API_URL).flush(expectedResponse);

      expect(receivedResponse).toBeDefined();
      expect(receivedResponse!.chapterId).toBe('CH01');
      expect(receivedResponse!.chapterLocalDate).toBe('2026-04-04T00:00:00');
    });
  });

  // ---- updateChapterLocalDate (tested indirectly through fetchChapterTimezone) ----

  describe('updateChapterLocalDate (via fetch)', () => {
    it('should compute chapterUtcOffsetMinutes from response', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      // After fetch, offset should be computed (non-null)
      expect(service.getChapterUtcOffsetMinutes()).not.toBeNull();
      expect(typeof service.getChapterUtcOffsetMinutes()).toBe('number');
    });

    it('should set chapterDateTimeSnapshotAt for elapsed-time tracking', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      // getChapterLocalDateTime should advance beyond the snapshot
      const dt = service.getChapterLocalDateTime();
      expect(dt.isValid()).toBe(true);
    });

    it('should NOT compute chapterUtcOffsetMinutes when chapterLocalDateTime is absent', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse({ chapterLocalDateTime: undefined }));

      // Offset should remain null when no datetime is provided
      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });

    it('should set chapterLocalDate to start of day', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const date = service.chapterLocalDate();
      expect(date).not.toBeNull();
      expect(date!.hour()).toBe(0);
      expect(date!.minute()).toBe(0);
      expect(date!.second()).toBe(0);
      expect(date!.millisecond()).toBe(0);
    });

    it('should handle response with different date values', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse({
        chapterLocalDate: '2025-12-31T00:00:00',
        chapterLocalDateTime: '2025-12-31T23:59:59'
      }));

      expect(service.chapterLocalDate()!.format('YYYY-MM-DD')).toBe('2025-12-31');
      expect(service.chapterLocalDateTime()!.format('YYYY-MM-DD HH:mm:ss')).toBe('2025-12-31 23:59:59');
    });
  });

  // ---- getChapterLocalDate ----

  describe('getChapterLocalDate', () => {
    it('should return start-of-day from chapter local datetime', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const date = service.getChapterLocalDate();
      expect(date.hour()).toBe(0);
      expect(date.minute()).toBe(0);
      expect(date.second()).toBe(0);
      expect(date.format('YYYY-MM-DD')).toBe('2026-04-04');
    });

    it('should fall back to moment() when no chapter data loaded', () => {
      const before = moment();
      const date = service.getChapterLocalDate();
      const after = moment();

      expect(date.isSameOrAfter(before.startOf('day'))).toBe(true);
      expect(date.isSameOrBefore(after.endOf('day'))).toBe(true);
    });

    it('should return a clone (not the same reference as the signal)', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const date1 = service.getChapterLocalDate();
      const date2 = service.getChapterLocalDate();
      expect(date1).not.toBe(date2);
    });

    it('should always return start-of-day even when datetime has time component', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse({
        chapterLocalDateTime: '2026-04-04T18:45:30'
      }));

      const date = service.getChapterLocalDate();
      expect(date.hour()).toBe(0);
      expect(date.minute()).toBe(0);
      expect(date.second()).toBe(0);
    });
  });

  // ---- getChapterLocalDateTime ----

  describe('getChapterLocalDateTime', () => {
    it('should return the snapshot advanced by elapsed time', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const dt = service.getChapterLocalDateTime();
      expect(dt.isValid()).toBe(true);
      // The returned moment should be >= the API snapshot time
      expect(dt.isSameOrAfter(moment('2026-04-04T14:30:00'))).toBe(true);
    });

    it('should return a clone (not the same reference)', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const dt1 = service.getChapterLocalDateTime();
      const dt2 = service.getChapterLocalDateTime();
      expect(dt1).not.toBe(dt2);
    });

    it('should return moment() fallback when chapterLocalDateTime is null', () => {
      const before = moment();
      const dt = service.getChapterLocalDateTime();
      expect(dt.isValid()).toBe(true);
      expect(dt.diff(before, 'seconds')).toBeLessThanOrEqual(1);
    });

    it('should return clone without elapsed adjustment when snapshot time is null', () => {
      // Manually set chapterLocalDateTime without snapshot timestamp
      service.chapterLocalDateTime.set(moment('2026-06-15T10:00:00'));
      // chapterDateTimeSnapshotAt remains null

      const dt = service.getChapterLocalDateTime();
      expect(dt.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 10:00');
    });

    it('should fall back to moment() when chapterLocalDateTime is set to an invalid moment', () => {
      // Set an invalid moment to exercise the localDateTime.isValid() === false branch
      service.chapterLocalDateTime.set(moment.invalid());

      const before = moment();
      const dt = service.getChapterLocalDateTime();
      expect(dt.isValid()).toBe(true);
      expect(dt.diff(before, 'seconds')).toBeLessThanOrEqual(1);
    });

    it('should return a valid moment when chapterLocalDateTime is set but chapterDateTimeSnapshotAt is null', () => {
      // This tests the branch: localDateTime valid, but snapshotAt is null
      service.chapterLocalDateTime.set(moment('2026-01-15T08:30:00'));

      const dt = service.getChapterLocalDateTime();
      expect(dt.isValid()).toBe(true);
      expect(dt.format('HH:mm')).toBe('08:30');
    });

    it('should not mutate the stored chapterLocalDateTime', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const storedBefore = service.chapterLocalDateTime()!.format();
      service.getChapterLocalDateTime().add(5, 'hours');
      const storedAfter = service.chapterLocalDateTime()!.format();

      expect(storedBefore).toBe(storedAfter);
    });
  });

  // ---- isChapterLocalDateAvailable ----

  describe('isChapterLocalDateAvailable', () => {
    it('should return false initially', () => {
      expect(service.isChapterLocalDateAvailable()).toBe(false);
    });

    it('should return true after fetching chapter timezone', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      expect(service.isChapterLocalDateAvailable()).toBe(true);
    });

    it('should return false after clearing chapter local date', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();
      expect(service.isChapterLocalDateAvailable()).toBe(false);
    });

    it('should return false when chapterLocalDate is set to an invalid moment', () => {
      // Exercise the localDate.isValid() === false branch
      service.chapterLocalDate.set(moment.invalid());
      expect(service.isChapterLocalDateAvailable()).toBe(false);
    });

    it('should return true when chapterLocalDate is set to a valid moment', () => {
      service.chapterLocalDate.set(moment('2025-06-15'));
      expect(service.isChapterLocalDateAvailable()).toBe(true);
    });

    it('should return false when chapterLocalDate is null', () => {
      service.chapterLocalDate.set(null);
      expect(service.isChapterLocalDateAvailable()).toBe(false);
    });
  });

  // ---- convertLocalToGmt ----

  describe('convertLocalToGmt', () => {
    it('should subtract chapter UTC offset when offset is known', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const offset = service.getChapterUtcOffsetMinutes()!;
      const localTime = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(localTime);

      // gmt = localTime - offset
      const expected = localTime.clone().subtract(offset, 'minutes');
      expect(gmt.format()).toBe(expected.format());
    });

    it('should fall back to .utc() when offset is not known', () => {
      const localTime = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(localTime);

      expect(gmt.isUtc()).toBe(true);
    });

    it('should not mutate the input moment', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const original = moment('2026-04-04T14:30:00');
      const originalFormat = original.format();
      service.convertLocalToGmt(original);

      expect(original.format()).toBe(originalFormat);
    });

    it('should return a clone even when offset is known', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const localTime = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(localTime);

      expect(gmt).not.toBe(localTime);
    });

    it('should return a clone even when falling back to utc()', () => {
      const localTime = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(localTime);

      expect(gmt).not.toBe(localTime);
    });

    it('should handle midnight conversion', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const midnight = moment('2026-04-04T00:00:00');
      const gmt = service.convertLocalToGmt(midnight);

      expect(gmt.isValid()).toBe(true);
    });
  });

  // ---- convertGmtToLocal ----

  describe('convertGmtToLocal', () => {
    it('should add chapter UTC offset when offset is known', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const offset = service.getChapterUtcOffsetMinutes()!;
      const gmtTime = moment.utc('2026-04-04T19:30:00');
      const local = service.convertGmtToLocal(gmtTime);

      const expected = gmtTime.clone().add(offset, 'minutes');
      expect(local.format()).toBe(expected.format());
    });

    it('should return a clone when offset is not known', () => {
      const gmtTime = moment.utc('2026-04-04T19:30:00');
      const local = service.convertGmtToLocal(gmtTime);

      expect(local.format()).toBe(gmtTime.format());
      expect(local).not.toBe(gmtTime); // cloned
    });

    it('should not mutate the input moment', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const original = moment.utc('2026-04-04T19:30:00');
      const originalFormat = original.format();
      service.convertGmtToLocal(original);

      expect(original.format()).toBe(originalFormat);
    });

    it('should return a clone even when offset is known', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const gmtTime = moment.utc('2026-04-04T19:30:00');
      const local = service.convertGmtToLocal(gmtTime);

      expect(local).not.toBe(gmtTime);
    });

    it('should handle midnight UTC conversion', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const midnight = moment.utc('2026-04-04T00:00:00');
      const local = service.convertGmtToLocal(midnight);

      expect(local.isValid()).toBe(true);
    });
  });

  // ---- convertLocalToGmt and convertGmtToLocal are inverses ----

  describe('round-trip conversion', () => {
    it('should return the original value after local->gmt->local', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const localTime = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(localTime);
      const backToLocal = service.convertGmtToLocal(gmt);

      expect(backToLocal.format('YYYY-MM-DD HH:mm:ss')).toBe(localTime.format('YYYY-MM-DD HH:mm:ss'));
    });

    it('should return the original value after gmt->local->gmt', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const gmtTime = moment.utc('2026-04-04T19:30:00');
      const local = service.convertGmtToLocal(gmtTime);
      const backToGmt = service.convertLocalToGmt(local);

      expect(backToGmt.format('YYYY-MM-DD HH:mm:ss')).toBe(gmtTime.format('YYYY-MM-DD HH:mm:ss'));
    });
  });

  // ---- getChapterUtcOffsetMinutes ----

  describe('getChapterUtcOffsetMinutes', () => {
    it('should return null before any fetch', () => {
      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });

    it('should return a number after fetch', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      expect(typeof service.getChapterUtcOffsetMinutes()).toBe('number');
    });

    it('should return null after fetch without chapterLocalDateTime', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse({ chapterLocalDateTime: undefined }));

      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });

    it('should return null after clearChapterLocalDate', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      expect(service.getChapterUtcOffsetMinutes()).not.toBeNull();

      service.clearChapterLocalDate();
      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });

    it('should update when a new fetch occurs', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      const firstOffset = service.getChapterUtcOffsetMinutes();

      service.fetchChapterTimezone('CH02').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse({
        chapterId: 'CH02',
        chapterLocalDate: '2026-04-04T00:00:00',
        chapterLocalDateTime: '2026-04-04T14:30:00'
      }));

      const secondOffset = service.getChapterUtcOffsetMinutes();
      expect(typeof secondOffset).toBe('number');
    });
  });

  // ---- clearChapterLocalDate ----

  describe('clearChapterLocalDate', () => {
    it('should reset all signals and private state', () => {
      // First load data
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      // Verify data is loaded
      expect(service.chapterLocalDate()).not.toBeNull();
      expect(service.chapterLocalDateTime()).not.toBeNull();
      expect(service.currentChapterId()).toBe('CH01');
      expect(service.getChapterUtcOffsetMinutes()).not.toBeNull();

      // Clear
      service.clearChapterLocalDate();

      // Verify everything is reset
      expect(service.chapterLocalDate()).toBeNull();
      expect(service.chapterLocalDateTime()).toBeNull();
      expect(service.currentChapterId()).toBe('');
      expect(service.getChapterUtcOffsetMinutes()).toBeNull();
    });

    it('should be safe to call when no data is loaded', () => {
      expect(() => service.clearChapterLocalDate()).not.toThrow();
      expect(service.chapterLocalDate()).toBeNull();
    });

    it('should cause isChapterLocalDateAvailable to return false', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();
      expect(service.isChapterLocalDateAvailable()).toBe(false);
    });

    it('should cause getChapterLocalDateTime to fall back to moment()', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();

      const before = moment();
      const dt = service.getChapterLocalDateTime();
      expect(dt.diff(before, 'seconds')).toBeLessThanOrEqual(1);
    });

    it('should cause convertLocalToGmt to fall back to utc()', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();

      const local = moment('2026-04-04T14:30:00');
      const gmt = service.convertLocalToGmt(local);
      expect(gmt.isUtc()).toBe(true);
    });

    it('should cause convertGmtToLocal to return a clone without offset adjustment', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();

      const gmtTime = moment.utc('2026-04-04T19:30:00');
      const local = service.convertGmtToLocal(gmtTime);
      // Without offset, should return a clone of the input
      expect(local.format()).toBe(gmtTime.format());
      expect(local).not.toBe(gmtTime);
    });

    it('should be safe to call multiple times in a row', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();
      expect(() => service.clearChapterLocalDate()).not.toThrow();
      expect(() => service.clearChapterLocalDate()).not.toThrow();

      expect(service.chapterLocalDate()).toBeNull();
      expect(service.chapterLocalDateTime()).toBeNull();
      expect(service.currentChapterId()).toBe('');
    });
  });

  // ---- multiple fetches ----

  describe('multiple chapter switches', () => {
    it('should update signals when switching chapters', () => {
      // Fetch first chapter
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());
      expect(service.currentChapterId()).toBe('CH01');

      // Fetch second chapter
      service.fetchChapterTimezone('CH02').subscribe();
      httpMock.expectOne(API_URL).flush(
        makeResponse({
          chapterId: 'CH02',
          chapterLocalDate: '2026-05-10T00:00:00',
          chapterLocalDateTime: '2026-05-10T09:15:00',
        })
      );

      expect(service.currentChapterId()).toBe('CH02');
      expect(service.chapterLocalDate()!.format('YYYY-MM-DD')).toBe('2026-05-10');
    });

    it('should update chapterLocalDateTime when switching chapters', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.fetchChapterTimezone('CH02').subscribe();
      httpMock.expectOne(API_URL).flush(
        makeResponse({
          chapterId: 'CH02',
          chapterLocalDate: '2026-05-10T00:00:00',
          chapterLocalDateTime: '2026-05-10T09:15:00',
        })
      );

      const dt = service.chapterLocalDateTime();
      expect(dt).not.toBeNull();
      expect(dt!.format('YYYY-MM-DD HH:mm')).toBe('2026-05-10 09:15');
    });

    it('should update offset when switching chapters', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());
      const offset1 = service.getChapterUtcOffsetMinutes();

      service.fetchChapterTimezone('CH02').subscribe();
      httpMock.expectOne(API_URL).flush(
        makeResponse({
          chapterId: 'CH02',
          chapterLocalDate: '2026-05-10T00:00:00',
          chapterLocalDateTime: '2026-05-10T09:15:00',
        })
      );
      const offset2 = service.getChapterUtcOffsetMinutes();

      // Both offsets should be numbers (may or may not be equal)
      expect(typeof offset1).toBe('number');
      expect(typeof offset2).toBe('number');
    });

    it('should allow clear and re-fetch', () => {
      service.fetchChapterTimezone('CH01').subscribe();
      httpMock.expectOne(API_URL).flush(makeResponse());

      service.clearChapterLocalDate();
      expect(service.isChapterLocalDateAvailable()).toBe(false);

      service.fetchChapterTimezone('CH02').subscribe();
      httpMock.expectOne(API_URL).flush(
        makeResponse({
          chapterId: 'CH02',
          chapterLocalDate: '2026-07-01T00:00:00',
          chapterLocalDateTime: '2026-07-01T12:00:00',
        })
      );

      expect(service.isChapterLocalDateAvailable()).toBe(true);
      expect(service.currentChapterId()).toBe('CH02');
      expect(service.chapterLocalDate()!.format('YYYY-MM-DD')).toBe('2026-07-01');
    });
  });
});
