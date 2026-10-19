import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HeaderService } from './header.service';
import { LoginService } from './login.service';
import { ChapterTimezoneService } from './chapter-timezone.service';
import { SystemUserResponse } from '../models/header.model';
import { of, throwError } from 'rxjs';

describe('HeaderService', () => {
  let service: HeaderService;
  let httpMock: HttpTestingController;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let chapterTzSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let sanitizerSpy: jasmine.SpyObj<DomSanitizer>;
  let sessionStorageSpy: jasmine.SpyObj<Storage>;
  let originalSessionStorage: Storage;

  const mockUser: SystemUserResponse = {
    userId: 'user1',
    chapterId: 'CH01',
    userFirstName: 'John',
    userLastName: 'Doe',
    warehouseId: 'WH01',
    databasePrefix: 'DEV',
    databaseName: 'devdb',
    printHdr: 'Dallas Blood Center',
    chapterName: 'Dallas Chapter',
    warehouseName: 'Main Warehouse',
    chapterTimezone: 'America/Chicago',
  };

  beforeEach(() => {
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    chapterTzSpy = jasmine.createSpyObj('ChapterTimezoneService', ['fetchChapterTimezone']);
    sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

    loginServiceSpy.getStoredUsername.and.returnValue('testuser');
    chapterTzSpy.fetchChapterTimezone.and.returnValue(of({} as any));

    originalSessionStorage = window.sessionStorage;
    sessionStorageSpy = jasmine.createSpyObj('sessionStorage', [
      'setItem', 'getItem', 'removeItem', 'clear', 'key'
    ]);
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageSpy,
      writable: true,
      configurable: true,
    });
    sanitizerSpy.bypassSecurityTrustUrl.and.callFake((url: string) => url as any);

    if (typeof URL.createObjectURL !== 'function') {
      (URL as any).createObjectURL = () => '';
    }
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test-url');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HeaderService,
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
      ],
    });
    service = TestBed.inject(HeaderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  // ── service creation ─────────────────────────────────────────────

  it('should be created with default signal values', () => {
    expect(service).toBeTruthy();
    expect(service.chapterId()).toBe('');
    expect(service.warehouseId()).toBe('');
    expect(service.chapterName()).toBe('');
    expect(service.warehouseName()).toBe('');
    expect(service.chapterTimeZone()).toBe('');
    expect(service.chapterPrintHdr()).toBe('');
    expect(service.databasePrefix()).toBe('');
    expect(service.databaseName()).toBe('');
    expect(service.institutionLogoUrl()).toBe('');
    expect(service.headerConfig().title).toBe('Blood Centers');
    expect(service.headerConfig().subtitle).toBe("Boston Children's Hospital");
  });

  // ── updateHeaderFromApiResponse ───────────────────────────────────

  describe('updateHeaderFromApiResponse', () => {
    it('updates user info, database signals, and defaults role to User', () => {
      service.updateHeaderFromApiResponse(mockUser);

      expect(service.databasePrefix()).toBe('DEV');
      expect(service.databaseName()).toBe('devdb');
      expect(service.headerConfig().user?.name).toBe('John Doe');
      expect(service.headerConfig().user?.id).toBe('user1');
      expect(service.headerConfig().user?.role).toBe('User');
    });

    it('sets all chapter and warehouse signals when preserveChapterWarehouse is false', () => {
      service.updateHeaderFromApiResponse(mockUser, false);

      expect(service.chapterId()).toBe('CH01');
      expect(service.chapterName()).toBe('Dallas Chapter');
      expect(service.warehouseId()).toBe('WH01');
      expect(service.warehouseName()).toBe('Main Warehouse');
      expect(service.chapterPrintHdr()).toBe('Dallas Blood Center');
      expect(service.chapterTimeZone()).toBe('America/Chicago');
    });

    it('does not update chapter or warehouse signals when preserveChapterWarehouse is true', () => {
      service.chapterId.set('EXISTING');
      service.warehouseId.set('WH_EXIST');

      service.updateHeaderFromApiResponse(mockUser, true);

      expect(service.chapterId()).toBe('EXISTING');
      expect(service.warehouseId()).toBe('WH_EXIST');
    });

    it('stores session data when preserveChapterWarehouse is false', () => {
      service.updateHeaderFromApiResponse(mockUser, false);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_id', 'CH01');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_warehouse_id', 'WH01');
    });

    it('does not store session data when preserveChapterWarehouse is true', () => {
      service.updateHeaderFromApiResponse(mockUser, true);

      expect(sessionStorageSpy.setItem).not.toHaveBeenCalled();
    });

    it('defaults chapterTimezone to UTC when response has no timezone', () => {
      const userNoTz = { ...mockUser, chapterTimezone: undefined };

      service.updateHeaderFromApiResponse(userNoTz, false);

      expect(service.chapterTimeZone()).toBe('UTC');
    });

    it('uses chapterName as printHdr fallback when printHdr is empty', () => {
      const userNoPrintHdr = { ...mockUser, printHdr: '' };

      service.updateHeaderFromApiResponse(userNoPrintHdr, false);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_print_hdr', 'Dallas Chapter');
    });

    it('preserves existing user role when present', () => {
      service.headerConfig.update(c => ({
        ...c,
        user: { name: 'Old', id: 'old', role: 'Admin' },
      }));

      service.updateHeaderFromApiResponse(mockUser);

      expect(service.headerConfig().user?.role).toBe('Admin');
    });

    it('preserves existing user avatarUrl when present', () => {
      service.headerConfig.update(c => ({
        ...c,
        user: { name: 'Old', id: 'old', role: 'Admin', avatarUrl: 'avatar.png' },
      }));

      service.updateHeaderFromApiResponse(mockUser);

      expect(service.headerConfig().user?.avatarUrl).toBe('avatar.png');
    });

    it('stores session data with correct key-value pairs', () => {
      service.updateHeaderFromApiResponse(mockUser, false);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_id', 'CH01');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_name', 'Dallas Chapter');
    });

    it('stores all six session items when preserveChapterWarehouse is false', () => {
      service.updateHeaderFromApiResponse(mockUser, false);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledTimes(6);
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_name', 'Dallas Chapter');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_warehouse_name', 'Main Warehouse');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_timezone', 'America/Chicago');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_print_hdr', 'Dallas Blood Center');
    });

    it('stores UTC as timezone session value when response timezone is undefined', () => {
      const userNoTz = { ...mockUser, chapterTimezone: undefined };

      service.updateHeaderFromApiResponse(userNoTz, false);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_timezone', 'UTC');
    });
  });

  // ── updateChapterAndWarehouse ─────────────────────────────────────

  describe('updateChapterAndWarehouse', () => {
    it('updates all chapter and warehouse signals', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston Chapter', 'WH02', 'South Warehouse');

      expect(service.chapterId()).toBe('CH02');
      expect(service.chapterName()).toBe('Boston Chapter');
      expect(service.warehouseId()).toBe('WH02');
      expect(service.warehouseName()).toBe('South Warehouse');
    });

    it('sets chapterTimezone when provided', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South', 'America/New_York');

      expect(service.chapterTimeZone()).toBe('America/New_York');
    });

    it('does not change chapterTimezone when not provided', () => {
      service.chapterTimeZone.set('America/Chicago');

      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');

      expect(service.chapterTimeZone()).toBe('America/Chicago');
    });

    it('uses chapterName as printHdr fallback when chapterPrintHdr not provided', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston Chapter', 'WH02', 'South');

      expect(service.chapterPrintHdr()).toBe('Boston Chapter');
    });

    it('uses chapterPrintHdr when provided', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South', undefined, 'Custom Header');

      expect(service.chapterPrintHdr()).toBe('Custom Header');
    });

    it('stores session data with correct values', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South', 'America/New_York', 'Print Hdr');

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_id', 'CH02');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_warehouse_name', 'South');
      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_timezone', 'America/New_York');
    });

    it('fetches chapter timezone from the service', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');

      expect(chapterTzSpy.fetchChapterTimezone).toHaveBeenCalledWith('CH02');
    });

    it('removes driveContext and labelPrinterContext from sessionStorage', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('driveContext');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('labelPrinterContext');
    });

    it('emits chapterChanged$ event', () => {
      let emitted = false;
      service.chapterChanged$.subscribe(() => emitted = true);

      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');

      expect(emitted).toBe(true);
    });

    it('uses existing chapterTimeZone signal value for session when timezone param is absent', () => {
      service.chapterTimeZone.set('America/Denver');

      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('current_chapter_timezone', 'America/Denver');
    });

    it('stores all six session items', () => {
      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South', 'America/New_York', 'Header');

      expect(sessionStorageSpy.setItem).toHaveBeenCalledTimes(6);
    });
  });

  // ── updateHeaderConfig ────────────────────────────────────────────

  describe('updateHeaderConfig', () => {
    it('merges partial config with existing config', () => {
      service.updateHeaderConfig({ title: 'New Title' });

      expect(service.headerConfig().title).toBe('New Title');
      expect(service.headerConfig().subtitle).toBe("Boston Children's Hospital");
    });

    it('can update multiple fields at once', () => {
      service.updateHeaderConfig({ title: 'New Title', subtitle: 'New Sub', logoUrl: 'new.png' });

      expect(service.headerConfig().title).toBe('New Title');
      expect(service.headerConfig().subtitle).toBe('New Sub');
      expect(service.headerConfig().logoUrl).toBe('new.png');
    });
  });

  // ── loadFromCookies ───────────────────────────────────────────────

  describe('loadFromCookies', () => {
    it('sets signals from session values when session data exists', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        const values: Record<string, string> = {
          current_chapter_id: 'C1',
          current_chapter_name: 'Chapter One',
          current_warehouse_id: 'W1',
          current_warehouse_name: 'Warehouse One',
          current_chapter_timezone: 'America/Denver',
          current_chapter_print_hdr: 'Print Header',
        };
        return values[key] || null;
      });

      service.loadFromCookies();

      expect(service.chapterId()).toBe('C1');
      expect(service.chapterName()).toBe('Chapter One');
      expect(service.warehouseId()).toBe('W1');
      expect(service.warehouseName()).toBe('Warehouse One');
      expect(service.chapterTimeZone()).toBe('America/Denver');
      expect(service.chapterPrintHdr()).toBe('Print Header');
    });

    it('does not set signals for missing session data', () => {
      service.chapterId.set('ORIGINAL');

      service.loadFromCookies();

      expect(service.chapterId()).toBe('ORIGINAL');
    });

    it('sets only the signals that have session values', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'current_chapter_id') return 'C1';
        if (key === 'current_warehouse_id') return 'W1';
        return null;
      });

      service.loadFromCookies();

      expect(service.chapterId()).toBe('C1');
      expect(service.warehouseId()).toBe('W1');
      expect(service.chapterName()).toBe('');
      expect(service.warehouseName()).toBe('');
    });
  });

  // ── clearCookies ──────────────────────────────────────────────────

  describe('clearCookies', () => {
    it('removes all chapter and warehouse session keys', () => {
      service.clearCookies();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_chapter_id');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_chapter_name');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_warehouse_id');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_warehouse_name');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_chapter_timezone');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('current_chapter_print_hdr');
    });

    it('calls removeItem exactly six times', () => {
      service.clearCookies();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledTimes(6);
    });
  });

  // ── fetchSystemUser ───────────────────────────────────────────────

  describe('fetchSystemUser', () => {
    it('returns response and updates header on success', (done) => {
      service.fetchSystemUser('user1').subscribe({
        next: (response) => {
          expect(response).toEqual(mockUser);
          expect(service.databaseName()).toBe('devdb');
          expect(service.chapterId()).toBe('CH01');
          done();
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('system-users/user1'));
      req.flush(mockUser);
    });

    it('fetches chapter timezone after loading user data', (done) => {
      service.fetchSystemUser('user1').subscribe({
        next: () => {
          expect(chapterTzSpy.fetchChapterTimezone).toHaveBeenCalledWith('CH01');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users/user1')).flush(mockUser);
    });

    it('handles timezone fetch failure without failing the operation', (done) => {
      chapterTzSpy.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz error')));

      service.fetchSystemUser('user1').subscribe({
        next: (response) => {
          expect(response).toEqual(mockUser);
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users/user1')).flush(mockUser);
    });

    it('passes empty string for chapterId when response has no chapterId', (done) => {
      const userNoChapter = { ...mockUser, chapterId: '' };

      service.fetchSystemUser('user1').subscribe({
        next: () => {
          expect(chapterTzSpy.fetchChapterTimezone).toHaveBeenCalledWith('');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users')).flush(userNoChapter);
    });

    it('propagates server HTTP error', (done) => {
      service.fetchSystemUser('user1').subscribe({
        error: (err) => {
          expect(err.message).toContain('500');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users'))
        .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('handles client-side ErrorEvent errors', (done) => {
      service.fetchSystemUser('user1').subscribe({
        error: (err) => {
          expect(err.message).toContain('A network error occurred');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users'))
        .error(new ErrorEvent('error', { message: 'A network error occurred' }) as any);
    });

    it('preserves chapter and warehouse when preserveChapterWarehouse is true', (done) => {
      service.chapterId.set('EXISTING');
      service.warehouseId.set('WH_EXIST');

      service.fetchSystemUser('user1', true).subscribe({
        next: () => {
          expect(service.chapterId()).toBe('EXISTING');
          expect(service.warehouseId()).toBe('WH_EXIST');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('system-users')).flush(mockUser);
    });

    it('constructs correct URL with userId', () => {
      service.fetchSystemUser('admin_user').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('api/v1/system-users/admin_user'));
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  // ── fetchSystemUserByEmail ────────────────────────────────────────

  describe('fetchSystemUserByEmail', () => {
    it('returns single object response directly', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: (response) => {
          expect(response.userId).toBe('user1');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(mockUser);
    });

    it('extracts first element from single-element array response', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: (response) => {
          expect(response.userId).toBe('user1');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush([mockUser]);
    });

    it('throws error for empty array response', (done) => {
      service.fetchSystemUserByEmail('nobody@test.com').subscribe({
        error: (err) => {
          expect(err.message).toContain('No user found');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush([]);
    });

    it('throws MULTIPLE_USERS_FOUND for multi-element array response', (done) => {
      service.fetchSystemUserByEmail('dup@test.com').subscribe({
        error: (err) => {
          expect(err.message).toContain('MULTIPLE_USERS_FOUND');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush([mockUser, { ...mockUser, userId: 'user2' }]);
    });

    it('updates header from single object response', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: () => {
          expect(service.chapterId()).toBe('CH01');
          expect(service.databaseName()).toBe('devdb');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(mockUser);
    });

    it('fetches chapter timezone after loading user data', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: () => {
          expect(chapterTzSpy.fetchChapterTimezone).toHaveBeenCalledWith('CH01');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(mockUser);
    });

    it('handles timezone fetch failure without failing the operation', (done) => {
      chapterTzSpy.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz error')));

      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: (response) => {
          expect(response).toEqual(mockUser);
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(mockUser);
    });

    it('preserves chapter/warehouse when preserveChapterWarehouse is true', (done) => {
      service.chapterId.set('EXISTING');
      service.warehouseId.set('WH_EXIST');

      service.fetchSystemUserByEmail('test@test.com', true).subscribe({
        next: () => {
          expect(service.chapterId()).toBe('EXISTING');
          expect(service.warehouseId()).toBe('WH_EXIST');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(mockUser);
    });

    it('propagates server HTTP error', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        error: (err) => {
          expect(err.message).toContain('500');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email'))
        .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('handles client-side ErrorEvent errors', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        error: (err) => {
          expect(err.message).toContain('client network error');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email'))
        .error(new ErrorEvent('error', { message: 'client network error' }) as any);
    });

    it('constructs correct URL with encoded email', () => {
      service.fetchSystemUserByEmail('user@example.com').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('by-email'));
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('passes empty string for chapterId when response has no chapterId', (done) => {
      const userNoChapter = { ...mockUser, chapterId: '' };

      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: () => {
          expect(chapterTzSpy.fetchChapterTimezone).toHaveBeenCalledWith('');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush(userNoChapter);
    });

    it('updates header from single-element array response', (done) => {
      service.fetchSystemUserByEmail('test@test.com').subscribe({
        next: () => {
          expect(service.chapterId()).toBe('CH01');
          expect(service.headerConfig().user?.name).toBe('John Doe');
          done();
        },
      });

      httpMock.expectOne(r => r.url.includes('by-email')).flush([mockUser]);
    });
  });

  // ── loadUserData ──────────────────────────────────────────────────

  describe('loadUserData', () => {
    it('calls fetchSystemUser with preserveChapterWarehouse true when session data exists', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'current_chapter_id') return 'CH01';
        if (key === 'current_warehouse_id') return 'WH01';
        return null;
      });
      loginServiceSpy.getStoredUsername.and.returnValue('jdoe');

      service.loadUserData();

      const req = httpMock.expectOne(r => r.url.includes('system-users/jdoe'));
      req.flush(mockUser);

      // Logo download
      const logoReq = httpMock.expectOne(r => r.url.includes('Auth/download'));
      logoReq.flush(new Blob(['img']));

      expect(service.chapterId()).toBe('CH01');
    });

    it('calls fetchSystemUser with preserveChapterWarehouse false when session data is empty', () => {
      loginServiceSpy.getStoredUsername.and.returnValue('jdoe');

      service.loadUserData();

      const req = httpMock.expectOne(r => r.url.includes('system-users/jdoe'));
      req.flush(mockUser);

      // Logo download
      const logoReq = httpMock.expectOne(r => r.url.includes('Auth/download'));
      logoReq.flush(new Blob(['img']));

      expect(service.chapterId()).toBe('CH01');
    });

    it('loads institution logo on success', () => {
      loginServiceSpy.getStoredUsername.and.returnValue('jdoe');

      service.loadUserData();

      httpMock.expectOne(r => r.url.includes('system-users')).flush(mockUser);

      const logoReq = httpMock.expectOne(r => r.url.includes('Auth/download/inst_logo.png'));
      expect(logoReq).toBeTruthy();
      logoReq.flush(new Blob(['img']));
    });

    it('handles API error silently', () => {
      loginServiceSpy.getStoredUsername.and.returnValue('jdoe');

      service.loadUserData();

      httpMock.expectOne(r => r.url.includes('system-users'))
        .flush('error', { status: 500, statusText: 'Error' });
    });

    it('loads from session before making API call', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'current_chapter_id') return 'COOKIE_CH';
        return null;
      });
      loginServiceSpy.getStoredUsername.and.returnValue('jdoe');

      service.loadUserData();

      // Before API response, session value should be set
      expect(service.chapterId()).toBe('COOKIE_CH');

      httpMock.expectOne(r => r.url.includes('system-users'))
        .flush('error', { status: 500, statusText: 'Error' });
    });

    it('uses username from loginService for API call', () => {
      loginServiceSpy.getStoredUsername.and.returnValue('specific_user');

      service.loadUserData();

      const req = httpMock.expectOne(r => r.url.includes('system-users/specific_user'));
      expect(req).toBeTruthy();
      req.flush(mockUser);

      httpMock.expectOne(r => r.url.includes('Auth/download')).flush(new Blob(['img']));
    });
  });

  // ── loadInstitutionLogo ───────────────────────────────────────────

  describe('loadInstitutionLogo', () => {
    it('makes HTTP GET for inst_logo.png', () => {
      service.loadInstitutionLogo();

      const req = httpMock.expectOne(r => r.url.includes('Auth/download/inst_logo.png'));
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['img']));
    });

    it('sets institutionLogoUrl signal on success', () => {
      service.loadInstitutionLogo();

      httpMock.expectOne(r => r.url.includes('Auth/download')).flush(new Blob(['img']));

      expect(sanitizerSpy.bypassSecurityTrustUrl).toHaveBeenCalledWith('blob:test-url');
      expect(service.institutionLogoUrl()).toBeTruthy();
    });

    it('updates headerConfig with institution logo URL on success', () => {
      service.loadInstitutionLogo();

      httpMock.expectOne(r => r.url.includes('Auth/download')).flush(new Blob(['img']));

      expect(service.headerConfig().institutionLogoUrl).toBeTruthy();
    });

    it('sets empty institutionLogoUrl on error', () => {
      service.institutionLogoUrl.set('previous-value' as any);

      service.loadInstitutionLogo();

      httpMock.expectOne(r => r.url.includes('Auth/download'))
        .error(new ProgressEvent('error'));

      expect(service.institutionLogoUrl()).toBe('');
    });

    it('creates object URL from blob response', () => {
      service.loadInstitutionLogo();

      httpMock.expectOne(r => r.url.includes('Auth/download')).flush(new Blob(['img']));

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  // ── getCurrentUsername ────────────────────────────────────────────

  describe('getCurrentUsername', () => {
    it('delegates to loginService.getStoredUsername', () => {
      loginServiceSpy.getStoredUsername.and.returnValue('admin');

      const result = service.getCurrentUsername();

      expect(result).toBe('admin');
      expect(loginServiceSpy.getStoredUsername).toHaveBeenCalled();
    });
  });

  // ── getter methods ───────────────────────────────────────────────

  describe('getCurrentChapterId', () => {
    it('returns the current chapterId signal value', () => {
      service.chapterId.set('CH99');
      expect(service.getCurrentChapterId()).toBe('CH99');
    });

    it('returns empty string by default', () => {
      expect(service.getCurrentChapterId()).toBe('');
    });
  });

  describe('getCurrentWarehouseId', () => {
    it('returns the current warehouseId signal value', () => {
      service.warehouseId.set('WH99');
      expect(service.getCurrentWarehouseId()).toBe('WH99');
    });

    it('returns empty string by default', () => {
      expect(service.getCurrentWarehouseId()).toBe('');
    });
  });

  describe('getCurrentChapterName', () => {
    it('returns the current chapterName signal value', () => {
      service.chapterName.set('Test Chapter');
      expect(service.getCurrentChapterName()).toBe('Test Chapter');
    });

    it('returns empty string by default', () => {
      expect(service.getCurrentChapterName()).toBe('');
    });
  });

  describe('getCurrentChapterTimezone', () => {
    it('returns the current chapterTimeZone signal value', () => {
      service.chapterTimeZone.set('America/Los_Angeles');
      expect(service.getCurrentChapterTimezone()).toBe('America/Los_Angeles');
    });

    it('returns empty string by default', () => {
      expect(service.getCurrentChapterTimezone()).toBe('');
    });
  });

  // ── chapterChanged$ ──────────────────────────────────────────────

  describe('chapterChanged$', () => {
    it('is an observable that can be subscribed to', () => {
      let emissionCount = 0;
      service.chapterChanged$.subscribe(() => emissionCount++);

      service.updateChapterAndWarehouse('CH02', 'Boston', 'WH02', 'South');
      service.updateChapterAndWarehouse('CH03', 'Denver', 'WH03', 'North');

      expect(emissionCount).toBe(2);
    });
  });
});
