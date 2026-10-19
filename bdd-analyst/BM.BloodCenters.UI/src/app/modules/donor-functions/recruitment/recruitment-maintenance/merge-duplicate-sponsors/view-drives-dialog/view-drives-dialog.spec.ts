import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewDrivesDialog } from './view-drives-dialog';
import { SponsorDriveModel } from '../models/merge-duplicate-sponsors.model';

describe('ViewDrivesDialog', () => {
  let component: ViewDrivesDialog;
  let fixture: ComponentFixture<ViewDrivesDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewDrivesDialog>>;

  const mockDrives: SponsorDriveModel[] = [
    { driveId: 'D003', driveDate: '2025-03-15', driveType: 'F', driveTypeDisplay: 'Fixed', status: 'Completed' },
    { driveId: 'D001', driveDate: '2025-01-10', driveType: 'M', driveTypeDisplay: 'Mobile', status: 'Active' },
    { driveId: 'D002', driveDate: '2025-02-20', driveType: 'F', driveTypeDisplay: 'Fixed', status: 'Cancelled' },
  ];

  const mockDialogData = {
    sponsorId: 'S001',
    sponsorName: 'Test Sponsor',
    drives: mockDrives,
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewDrivesDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDrivesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sort column and direction', () => {
    expect(component.sortColumn).toBe('driveId');
    expect(component.sortDirection).toBe('asc');
  });

  it('should expose dialog data with sponsor info', () => {
    expect(component.data.sponsorId).toBe('S001');
    expect(component.data.sponsorName).toBe('Test Sponsor');
    expect(component.data.drives.length).toBe(3);
  });

  describe('sortedDrives', () => {
    it('should sort drives by driveId ascending by default', () => {
      const sorted = component.sortedDrives;

      expect(sorted[0].driveId).toBe('D001');
      expect(sorted[1].driveId).toBe('D002');
      expect(sorted[2].driveId).toBe('D003');
    });

    it('should sort drives by driveId descending', () => {
      component.sortDirection = 'desc';

      const sorted = component.sortedDrives;

      expect(sorted[0].driveId).toBe('D003');
      expect(sorted[1].driveId).toBe('D002');
      expect(sorted[2].driveId).toBe('D001');
    });

    it('should sort by driveDate when sortColumn is driveDate', () => {
      component.sortColumn = 'driveDate';
      component.sortDirection = 'asc';

      const sorted = component.sortedDrives;

      expect(sorted[0].driveDate).toBe('2025-01-10');
      expect(sorted[1].driveDate).toBe('2025-02-20');
      expect(sorted[2].driveDate).toBe('2025-03-15');
    });

    it('should sort by driveTypeDisplay when sortColumn is driveType', () => {
      component.sortColumn = 'driveType';
      component.sortDirection = 'asc';

      const sorted = component.sortedDrives;

      // Fixed < Mobile alphabetically
      expect(sorted[0].driveTypeDisplay).toBe('Fixed');
      expect(sorted[2].driveTypeDisplay).toBe('Mobile');
    });

    it('should sort by status when sortColumn is status', () => {
      component.sortColumn = 'status';
      component.sortDirection = 'asc';

      const sorted = component.sortedDrives;

      // Active < Cancelled < Completed
      expect(sorted[0].status).toBe('Active');
      expect(sorted[1].status).toBe('Cancelled');
      expect(sorted[2].status).toBe('Completed');
    });

    it('should not mutate the original data array', () => {
      component.sortBy('driveDate');
      const sorted = component.sortedDrives;

      expect(component.data.drives[0].driveId).toBe('D003');
      expect(sorted[0].driveId).not.toBe('D003');
    });
  });

  describe('sortBy', () => {
    it('should toggle direction when sorting by the same column', () => {
      component.sortColumn = 'driveId';
      component.sortDirection = 'asc';

      component.sortBy('driveId');

      expect(component.sortDirection).toBe('desc');
    });

    it('should reset direction to asc when sorting by a new column', () => {
      component.sortColumn = 'driveId';
      component.sortDirection = 'desc';

      component.sortBy('driveDate');

      expect(component.sortColumn).toBe('driveDate');
      expect(component.sortDirection).toBe('asc');
    });

    it('should cycle asc -> desc -> asc on repeated clicks', () => {
      component.sortBy('status');
      expect(component.sortColumn).toBe('status');
      expect(component.sortDirection).toBe('asc');

      component.sortBy('status');
      expect(component.sortDirection).toBe('desc');

      component.sortBy('status');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('getSortIcon', () => {
    it('should return empty string for inactive column', () => {
      component.sortColumn = 'driveId';

      expect(component.getSortIcon('driveDate')).toBe('');
      expect(component.getSortIcon('status')).toBe('');
    });

    it('should return arrow_upward for ascending active column', () => {
      component.sortColumn = 'driveId';
      component.sortDirection = 'asc';

      expect(component.getSortIcon('driveId')).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending active column', () => {
      component.sortColumn = 'driveId';
      component.sortDirection = 'desc';

      expect(component.getSortIcon('driveId')).toBe('arrow_downward');
    });
  });

  describe('close', () => {
    it('should call dialogRef.close', () => {
      component.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
