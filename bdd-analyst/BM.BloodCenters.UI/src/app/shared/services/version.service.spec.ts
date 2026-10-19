import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { VersionService, VersionInfo } from './version.service';

describe('VersionService', () => {
  let service: VersionService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  const mockVersionInfo: VersionInfo = {
    version: '1.2.3',
    lastUpdatedUtc: '2026-05-07T10:00:00Z',
    branch: 'main',
    buildNumber: '123',
    buildId: 'abc-123',
    commit: '1a2b3c4d',
    major: '1',
    minor: '2',
    patch: '3',
    uiVersion: '2026-R1.2',
    releaseVersion: '2026-R1.5',
    baseVersion: '1.2.3',
    appVersion: '1.2.3-release',
  };

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        VersionService,
        { provide: HttpClient, useValue: httpClientSpy },
      ],
    });

    service = TestBed.inject(VersionService);
  });

  // =============================================
  // version$ getter
  // =============================================
  describe('version$', () => {
    it('should return an observable with default "Loading..." value', (done) => {
      // Arrange & Act
      service.version$.subscribe((version) => {
        // Assert
        expect(version).toBe('Loading...');
        done();
      });
    });

    it('should emit updated version after getVersionInfo succeeds', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe(() => {
        const versions: string[] = [];
        service.version$.subscribe((v) => versions.push(v));

        // Assert
        expect(versions[0]).toBe('2026-R1.5');
        done();
      });
    });
  });

  // =============================================
  // version getter (synchronous)
  // =============================================
  describe('version', () => {
    it('should return "Loading..." by default', () => {
      // Arrange & Act & Assert
      expect(service.version).toBe('Loading...');
    });

    it('should return the releaseVersion after successful load', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe();

      // Assert
      expect(service.version).toBe('2026-R1.5');
    });

    it('should return fallback releaseVersion after error', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe();

      // Assert
      expect(service.version).toBe('2026-R1.1');
    });
  });

  // =============================================
  // getVersionInfo
  // =============================================
  describe('getVersionInfo', () => {
    it('should fetch version info from /version.json', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe((info) => {
        // Assert
        expect(httpClientSpy.get).toHaveBeenCalledWith('/version.json');
        expect(info).toEqual(mockVersionInfo);
        done();
      });
    });

    it('should log the releaseVersion on successful load', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(console.log).toHaveBeenCalledWith('Version loaded:', '2026-R1.5');
        done();
      });
    });

    // ----- Branch: releaseVersion || uiVersion || version -----
    it('should use releaseVersion when it is truthy', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(service.version).toBe('2026-R1.5');
        done();
      });
    });

    it('should fall back to uiVersion when releaseVersion is empty', (done) => {
      // Arrange
      const infoNoRelease: VersionInfo = { ...mockVersionInfo, releaseVersion: '' };
      httpClientSpy.get.and.returnValue(of(infoNoRelease));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(service.version).toBe('2026-R1.2');
        done();
      });
    });

    it('should fall back to version when both releaseVersion and uiVersion are empty', (done) => {
      // Arrange
      const infoNoBoth: VersionInfo = { ...mockVersionInfo, releaseVersion: '', uiVersion: '' };
      httpClientSpy.get.and.returnValue(of(infoNoBoth));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(service.version).toBe('1.2.3');
        done();
      });
    });

    // ----- Branch: caching (versionInfo$ null vs existing) -----
    it('should cache the observable and not make multiple HTTP requests', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.getVersionInfo().subscribe();
      service.getVersionInfo().subscribe();
      service.getVersionInfo().subscribe();

      // Assert - only one HTTP call
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should return the same observable on subsequent calls', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      const obs1 = service.getVersionInfo();
      const obs2 = service.getVersionInfo();

      // Assert
      expect(obs1).toBe(obs2);
    });

    // ----- Error handling / catchError -----
    it('should return fallback VersionInfo on HTTP error', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('404 Not Found')));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe((info) => {
        // Assert
        expect(info.version).toBe('1.0.0-Local');
        expect(info.releaseVersion).toBe('2026-R1.1');
        expect(info.uiVersion).toBe('2026-R1.1');
        expect(info.branch).toBe('local');
        expect(info.commit).toBe('local-development');
        expect(info.buildId).toBe('local');
        expect(info.buildNumber).toBe('1.0.0-Local');
        expect(info.major).toBe('1');
        expect(info.minor).toBe('0');
        expect(info.patch).toBe('0');
        expect(info.baseVersion).toBe('1.0.0');
        expect(info.appVersion).toBe('1.0.0-Local');
        done();
      });
    });

    it('should warn when falling back due to error', (done) => {
      // Arrange
      const error = new Error('Network timeout');
      httpClientSpy.get.and.returnValue(throwError(() => error));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to load version.json, using fallback',
          error
        );
        done();
      });
    });

    it('should update currentVersion$ with fallback releaseVersion on error', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('500')));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe(() => {
        // Assert
        expect(service.version).toBe('2026-R1.1');
        done();
      });
    });

    it('should have a valid ISO date in fallback lastUpdatedUtc', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('error')));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe((fallback) => {
        // Assert
        const date = new Date(fallback.lastUpdatedUtc);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(fallback.lastUpdatedUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        done();
      });
    });

    // ----- shareReplay behavior -----
    it('should share the same value among multiple subscribers', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');
      let sub1Data: VersionInfo | null = null;

      // Act
      service.getVersionInfo().subscribe((data) => {
        sub1Data = data;
      });

      service.getVersionInfo().subscribe((data) => {
        // Assert
        expect(sub1Data).toEqual(data);
        expect(data).toEqual(mockVersionInfo);
        done();
      });
    });

    it('should replay cached value to late subscribers', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act - first subscriber
      service.getVersionInfo().subscribe();

      // Act - late subscriber
      service.getVersionInfo().subscribe((data) => {
        // Assert
        expect(data).toEqual(mockVersionInfo);
        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  // =============================================
  // initialize
  // =============================================
  describe('initialize', () => {
    it('should load version info on initialization', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.initialize();

      // Assert
      expect(service.version).toBe('2026-R1.5');
      expect(httpClientSpy.get).toHaveBeenCalledWith('/version.json');
    });

    it('should handle error gracefully during initialization', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('init error')));
      spyOn(console, 'warn');

      // Act
      service.initialize();

      // Assert
      expect(service.version).toBe('2026-R1.1');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should not make additional HTTP request if already initialized', () => {
      // Arrange
      httpClientSpy.get.and.returnValue(of(mockVersionInfo));
      spyOn(console, 'log');

      // Act
      service.initialize();
      service.initialize();

      // Assert - only one HTTP call
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });
  });

  // =============================================
  // Error scenarios
  // =============================================
  describe('error handling', () => {
    it('should handle 404 error gracefully', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => ({ status: 404, message: 'Not Found' })));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe((info) => {
        // Assert
        expect(info.releaseVersion).toBe('2026-R1.1');
        expect(console.warn).toHaveBeenCalled();
        done();
      });
    });

    it('should handle 500 error gracefully', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server Error' })));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe((info) => {
        // Assert
        expect(info.releaseVersion).toBe('2026-R1.1');
        expect(console.warn).toHaveBeenCalled();
        done();
      });
    });

    it('should handle network timeout error gracefully', (done) => {
      // Arrange
      httpClientSpy.get.and.returnValue(throwError(() => new Error('timeout')));
      spyOn(console, 'warn');

      // Act
      service.getVersionInfo().subscribe((info) => {
        // Assert
        expect(info.branch).toBe('local');
        expect(console.warn).toHaveBeenCalled();
        done();
      });
    });
  });
});
