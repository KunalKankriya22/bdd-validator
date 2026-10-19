import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { VersionInfoDialogComponent } from './version-info-dialog.component';
import { VersionService } from '@shared/services/version.service';

describe('VersionInfoDialogComponent', () => {
  let component: VersionInfoDialogComponent;
  let fixture: ComponentFixture<VersionInfoDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<VersionInfoDialogComponent>>;
  let mockVersionService: jasmine.SpyObj<VersionService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockVersionService = jasmine.createSpyObj('VersionService', ['getVersionInfo']);

    await TestBed.configureTestingModule({
      imports: [VersionInfoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: VersionService, useValue: mockVersionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VersionInfoDialogComponent);
    component = fixture.componentInstance;
  });

  it('should load version info on init', () => {
    // Arrange
    const mockVersionInfo = {
      version: '1.0.0',
      lastUpdatedUtc: '2026-05-06',
      branch: 'main',
      buildNumber: '100',
      buildId: 'build-100',
      commit: 'abc123',
      major: '1',
      minor: '0',
      patch: '0',
      uiVersion: '2026-R1.5',
      releaseVersion: '2026-R1.5',
      baseVersion: '1.0.0',
      appVersion: '1.0.0'
    };
    mockVersionService.getVersionInfo.and.returnValue(of(mockVersionInfo));

    // Act
    fixture.detectChanges(); // ngOnInit

    // Assert
    expect(mockVersionService.getVersionInfo).toHaveBeenCalled();
    expect(component.releaseVersion).toBe('2026-R1.5');
    expect(component.isLoading).toBe(false);
  });



  it('should fallback to uiVersion if releaseVersion is not available', () => {
    // Arrange
    const mockVersionInfo = {
      version: '1.0.0',
      lastUpdatedUtc: '2026-05-06',
      branch: 'main',
      buildNumber: '100',
      buildId: 'build-100',
      commit: 'abc123',
      major: '1',
      minor: '0',
      patch: '0',
      uiVersion: '2026-R1.4',
      releaseVersion: '',
      baseVersion: '1.0.0',
      appVersion: '1.0.0'
    };
    mockVersionService.getVersionInfo.and.returnValue(of(mockVersionInfo));

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.releaseVersion).toBe('2026-R1.4');
  });
});
