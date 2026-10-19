import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { DrawDetailsDialog, DrawDetailsDialogData } from './draw-details-dialog';
import { DrawQueryService } from '../../services/draw-query.service';
import { DriveDetail } from '../../models/draw-query.model';

describe('DrawDetailsDialog', () => {
  let component: DrawDetailsDialog;
  let fixture: ComponentFixture<DrawDetailsDialog>;
  let mockDrawQueryService: jasmine.SpyObj<DrawQueryService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DrawDetailsDialog>>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockDialogData: DrawDetailsDialogData = {
    driveDate: '2024-01-15',
    driveDay: 'Mon',
    numberOfDrives: 5,
    driveType: 'FIX'
  };

  const mockDriveDetails: DriveDetail[] = [
    {
      driveId: 'D001',
      driveDate: '2024-01-15',
      sponsorId: 'S001',
      sponsorName: 'Community Center',
      driveTimes: '09:00-15:00',
      recruiterId: 'R001',
      recruiterName: 'John Doe',
      projectedDraw: 50,
      driveType: 'F',
      driveTypeDescription: 'Fixed Drive',
      facilityCode: 'ABC',
      staffRequired: 5,
      vanRequired: 1,
      coachRequired: 2,
      locationId: 'L001'
    },
    {
      driveId: 'D002',
      driveDate: '2024-01-15',
      sponsorId: 'S002',
      sponsorName: 'Library',
      driveTimes: '10:00-16:00',
      recruiterId: 'R002',
      recruiterName: 'Jane Doe',
      projectedDraw: 30,
      driveType: 'F',
      driveTypeDescription: 'Fixed Drive',
      facilityCode: null as any,
      staffRequired: 3,
      vanRequired: 0,
      coachRequired: 1,
      locationId: 'L002'
    }
  ];

  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockDrawQueryService = jasmine.createSpyObj('DrawQueryService', [
      'getDriveDetails',
      'getDonationTypes',
      'getDriveProjections'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close', 'keydownEvents']);
    mockDialogRef.keydownEvents.and.returnValue(of());
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get', 'stream']);
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));
    mockTranslateService.stream.and.returnValue(of(''));

    mockDrawQueryService.getDriveDetails.and.returnValue(of(mockDriveDetails));

    await TestBed.configureTestingModule({
      imports: [DrawDetailsDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DrawQueryService, useValue: mockDrawQueryService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DrawDetailsDialog);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load drive details on ngOnInit', () => {
      component.ngOnInit();

      expect(mockDrawQueryService.getDriveDetails).toHaveBeenCalledWith(
        mockDialogData.driveDate,
        mockDialogData.driveType
      );
      expect(component.driveDetails).toEqual(mockDriveDetails);
      expect(component.isLoading).toBe(false);
    });

    it('should set isLoading to true during data load', () => {
      let loadingDuringRequest = false;
      mockDrawQueryService.getDriveDetails.and.callFake(() => {
        loadingDuringRequest = component.isLoading;
        return of(mockDriveDetails);
      });

      component.ngOnInit();

      expect(loadingDuringRequest).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when loading drive details', () => {
      mockDrawQueryService.getDriveDetails.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
      expect(component.driveDetails).toEqual([]);
    });

    it('should have empty driveDetails before ngOnInit', () => {
      expect(component.driveDetails).toEqual([]);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('formattedDate getter', () => {
    it('should return empty string for empty driveDate', () => {
      component.data = { ...mockDialogData, driveDate: '' };
      expect(component.formattedDate).toBe('');
    });

    it('should format date to DD-MON-YYYY | DayName format', () => {
      // 2024-01-15 is a Monday
      component.data = { ...mockDialogData, driveDate: '2024-01-15' };
      const result = component.formattedDate;
      expect(result).toContain('JAN');
      expect(result).toContain('2024');
      expect(result).toContain('15');
      expect(result).toContain('|');
    });

    it('should include day name in formatted date', () => {
      component.data = { ...mockDialogData, driveDate: '2024-01-15' };
      const result = component.formattedDate;
      // Jan 15 2024 is a Monday
      expect(result).toContain('Monday');
    });

    it('should format June date with correct month abbreviation', () => {
      component.data = { ...mockDialogData, driveDate: '2024-06-15T12:00:00' };
      const result = component.formattedDate;
      expect(result).toContain('JUN');
    });
  });

  describe('Total Calculations', () => {
    beforeEach(() => {
      component.driveDetails = mockDriveDetails;
    });

    it('should calculate total projected draw', () => {
      expect(component.getTotalProjectedDraw()).toBe(80); // 50 + 30
    });

    it('should calculate total staff required', () => {
      expect(component.getTotalStaff()).toBe(8); // 5 + 3
    });

    it('should calculate total van required', () => {
      expect(component.getTotalVan()).toBe(1); // 1 + 0
    });

    it('should calculate total coach required', () => {
      expect(component.getTotalCoach()).toBe(3); // 2 + 1
    });

    it('should return 0 for all totals when driveDetails is empty', () => {
      component.driveDetails = [];
      expect(component.getTotalProjectedDraw()).toBe(0);
      expect(component.getTotalStaff()).toBe(0);
      expect(component.getTotalVan()).toBe(0);
      expect(component.getTotalCoach()).toBe(0);
    });

    it('should handle null values in totals gracefully', () => {
      component.driveDetails = [{ ...mockDriveDetails[0], projectedDraw: null as any, staffRequired: null as any }];
      expect(component.getTotalProjectedDraw()).toBe(0);
      expect(component.getTotalStaff()).toBe(0);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    beforeEach(() => {
      component.driveDetails = mockDriveDetails;
    });

    it('should navigate to drive details and close dialog on view-details action', () => {
      component.onRowAction({ action: 'view-details', row: mockDriveDetails[0] });

      expect(sessionStorage.getItem('drawDetailsDialogData')).toBe(JSON.stringify(mockDialogData));
      expect(sessionStorage.getItem('shouldRestoreDrawQuery')).toBe('true');
      expect(sessionStorage.getItem('driveDetailsNavigating')).toBe('true');
      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/donor-functions/recruitment/recruitment-queries/drive-details-query'],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            driveId: 'D001',
            driveType: 'FIX'
          })
        })
      );
    });

    it('should not navigate for unknown action types', () => {
      component.onRowAction({ action: 'unknown', row: mockDriveDetails[0] });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should store dialog data with correct driveType in sessionStorage', () => {
      component.onRowAction({ action: 'view-details', row: mockDriveDetails[1] });

      const stored = JSON.parse(sessionStorage.getItem('drawDetailsDialogData')!);
      expect(stored.driveType).toBe('FIX');
      expect(stored.driveDate).toBe('2024-01-15');
    });
  });

  describe('tableConfig', () => {
    it('should have 12 columns', () => {
      expect(component.tableConfig.columns.length).toBe(12);
    });

    it('should format S.No column using driveDetails index + 1', () => {
      component.ngOnInit();
      const snoCol = component.tableConfig.columns.find(c => c.key === 'driveId');
      expect(snoCol?.valueFormatter).toBeDefined();
      // mockDriveDetails[0] is the first item
      expect(snoCol!.valueFormatter!('D001', mockDriveDetails[0])).toBe('1');
      expect(snoCol!.valueFormatter!('D002', mockDriveDetails[1])).toBe('2');
    });

    it('should format Drive ID column to show driveId from row', () => {
      const driveTypeCol = component.tableConfig.columns.find(c => c.key === 'driveType');
      expect(driveTypeCol?.valueFormatter).toBeDefined();
      expect(driveTypeCol!.valueFormatter!('F', mockDriveDetails[0])).toBe('D001');
    });

    it('should format P/Drw column to show projectedDraw as string', () => {
      const sponsorIdCol = component.tableConfig.columns.find(c => c.key === 'sponsorId');
      expect(sponsorIdCol?.valueFormatter).toBeDefined();
      expect(sponsorIdCol!.valueFormatter!('S001', mockDriveDetails[0])).toBe('50');
    });

    it('should format Facility column returning value when present', () => {
      const facilityCol = component.tableConfig.columns.find(c => c.key === 'facilityCode');
      expect(facilityCol?.valueFormatter).toBeDefined();
      expect(facilityCol!.valueFormatter!('ABC', mockDriveDetails[0])).toBe('ABC');
    });

    it('should format Facility column returning dash when value is null', () => {
      const facilityCol = component.tableConfig.columns.find(c => c.key === 'facilityCode');
      expect(facilityCol!.valueFormatter!(null as any, mockDriveDetails[1])).toBe('-');
    });

    it('should have no row actions', () => {
      expect(component.tableConfig.rowActions?.length).toBe(0);
    });
  });
});
