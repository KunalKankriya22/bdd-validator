import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';

export interface VersionInfo {
  version: string;
  lastUpdatedUtc: string;
  branch: string;
  buildNumber: string;
  buildId: string;
  commit: string;
  major: string;
  minor: string;
  patch: string;
  uiVersion: string;
  releaseVersion: string;
  baseVersion: string;
  appVersion: string;
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private http = inject(HttpClient);
  private versionInfo$: Observable<VersionInfo> | null = null;
  private currentVersion$ = new BehaviorSubject<string>('Loading...');

  /**
   * Get the current UI version as an observable
   */
  get version$(): Observable<string> {
    return this.currentVersion$.asObservable();
  }

  /**
   * Get the current UI version synchronously
   */
  get version(): string {
    return this.currentVersion$.value;
  }

  /**
   * Fetch complete version information from version.json
   */
  getVersionInfo(): Observable<VersionInfo> {
    if (!this.versionInfo$) {
      this.versionInfo$ = this.http.get<VersionInfo>('/version.json').pipe(
        tap((info: VersionInfo) => {
          this.currentVersion$.next(info.releaseVersion || info.uiVersion || info.version);
          console.log('Version loaded:', info.releaseVersion);
        }),
        catchError(error => {
          console.warn('Failed to load version.json, using fallback', error);
          const fallback = this.getLocalFallback();
          this.currentVersion$.next(fallback.releaseVersion);
          return of(fallback);
        }),
        shareReplay(1)
      );
    }
    return this.versionInfo$!;
  }

  /**
   * Initialize version service (call in app initialization)
   */
  initialize(): void {
    this.getVersionInfo().subscribe();
  }

  /**
   * Fallback version for local development
   */
  private getLocalFallback(): VersionInfo {
    return {
      version: '1.0.0-Local',
      lastUpdatedUtc: new Date().toISOString(),
      branch: 'local',
      buildNumber: '1.0.0-Local',
      buildId: 'local',
      commit: 'local-development',
      major: '1',
      minor: '0',
      patch: '0',
      uiVersion: '2026-R1.1',
      releaseVersion: '2026-R1.1',
      baseVersion: '1.0.0',
      appVersion: '1.0.0-Local'
    };
  }
}
