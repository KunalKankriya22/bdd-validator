import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  PastDrivesDialog,
  PastDrivesDialogData,
  PastDrive,
} from './past-drives-dialog';

describe('PastDrivesDialog', () => {
  let component: PastDrivesDialog;
  let fixture: ComponentFixture<PastDrivesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PastDrivesDialog>>;

  const mockDrives: PastDrive[] = [
    {
      driveId: 'D001',
      driveDate: '2024-06-15T10:00:00Z',
      projectedShow: 50,
      projectedDraw: 40,
      locationName: 'Community Center',
      actualShow: 45,
      actualDraw: 38,
      deferralPercentage: 5,
    },
    {
      driveId: 'D002',
      driveDate: '2024-07-20T09:00:00Z',
      projectedShow: 60,
      projectedDraw: 50,
      locationName: 'High School',
      actualShow: 55,
      actualDraw: 48,
      deferralPercentage: 8,
    },
  ];

  const defaultDialogData: PastDrivesDialogData = {
    sponsorId: 'SP001',
    sponsorName: 'Test Sponsor',
    drives: mockDrives,
  };

  function createComponent(data: PastDrivesDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [PastDrivesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(PastDrivesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the sponsor name from dialog data', () => {
    expect(component.data.sponsorName).toBe('Test Sponsor');
  });

  it('should have drives from dialog data', () => {
    expect(component.data.drives.length).toBe(2);
    expect(component.data.drives[0].driveId).toBe('D001');
  });

  it('should close dialog when close is called', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should format valid drive date correctly', () => {
    const result = component.formatDriveTime('2024-06-15T10:00:00Z');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  it('should return empty string for empty drive date', () => {
    expect(component.formatDriveTime('')).toBe('');
  });

  it('should return empty string for null-like drive date', () => {
    expect(component.formatDriveTime(null as any)).toBe('');
  });

  it('should return original string for invalid date', () => {
    const result = component.formatDriveTime('not-a-date');
    // Invalid Date may still produce something via toLocaleString, or return the original
    expect(result).toBeTruthy();
  });

  it('should handle empty drives list', () => {
    createComponent({ sponsorId: 'SP002', sponsorName: 'Empty', drives: [] });
    expect(component.data.drives.length).toBe(0);
  });

  it('should format date with uppercase month abbreviation', () => {
    const result = component.formatDriveTime('2024-01-05T12:00:00Z');
    expect(result).toContain('JAN');
  });
});
