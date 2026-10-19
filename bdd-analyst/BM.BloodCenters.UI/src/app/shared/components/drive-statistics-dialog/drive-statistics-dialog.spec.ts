import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DriveStatisticsDialogComponent } from './drive-statistics-dialog';
import { DriveStatisticsService } from '@shared/services/drive-statistics.service';
import { DriveStatisticsData, DriveStatisticsItem } from '@shared/models/drive-statistics.model';

describe('DriveStatisticsDialogComponent', () => {
  let serviceSpy: any;
  let dialogRefSpy: any;
  let component: DriveStatisticsDialogComponent;
  let fixture: ComponentFixture<DriveStatisticsDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DriveStatisticsDialogComponent>>;
  let mockService: jasmine.SpyObj<DriveStatisticsService>;

  const mockDialogData: DriveStatisticsData = {
    driveId: 'DRV0172094',
    chapterId: 'OBK',
  };

  const mockItem: DriveStatisticsItem = {
    header: {
      driveId: 'DRV0172094',
      chapterId: 'OBK',
      totalDonations: 249,
      driveDate: '05-31-2024',
      driveType: 'F',
      typeDescription: 'Fixed',
      sponsorId: 'SPON046693',
      sponsorName: 'CREEK COMMUNITY',
      projectedShow: 0,
      projectedDraw: 0,
      projectedDeferralRate: 12,
      actualDraw: 61,
      actualDeferral: 188,
      deferralRate: 75.5,
    },
    donations: [
      { donationType: 'AL', procedureCode: 'WB', count: 61 },
      { donationType: 'AL', procedureCode: 'PP', count: 43 },
    ],
    venipuncture: [
      { venipunctureCode: '01', description: 'Diff. Stick', count: 57 },
      { venipunctureCode: '02', description: 'Dbl. Stick', count: 2 },
    ],
    deferrals: {
      allogenic: [
        { deferralCode: 'HDT', origin: 'INQR', description: null, numberOfDeferrals: 24 },
      ],
      autologousTherapeutic: [
        { deferralCode: 'HDI', origin: '3', description: null, numberOfDeferrals: 1 },
      ],
    },
    unitDetails: [
      { unitId: 'W123424053111', donationType: 'AL', procedureCode: 'WB', attrib01: 'Y', attrib02: null, attrib03: null, attrib04: null, attrib05: null, attrib06: null, attrib07: null, attrib08: null },
    ],
    donorsList: [
      { donorId: 'DN30133334', lastName: 'Abbott', firstName: 'Kim', sex: 'M' },
      { donorId: 'DN30133335', lastName: 'Abernathy', firstName: 'Jimmy', sex: 'M' },
    ],
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('DriveStatisticsService', ['getDriveStatistics']);

    serviceSpy.getDriveStatistics.and.returnValue(of(mockItem));



      TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DriveStatisticsDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DriveStatisticsService, useValue: serviceSpy },
      ],
    });


    


      dialogRefSpy.close.calls.reset();


      serviceSpy.getDriveStatistics.calls.reset();


      serviceSpy.getDriveStatistics.and.returnValue(of(mockItem));


    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DriveStatisticsDialogComponent>>;
    mockService = TestBed.inject(DriveStatisticsService) as jasmine.SpyObj<DriveStatisticsService>;
    fixture = TestBed.createComponent(DriveStatisticsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {


    it('should load drive statistics on init with driveId and chapterId', () => {
      expect(mockService.getDriveStatistics).toHaveBeenCalledWith('DRV0172094', 'OBK');
    });

    it('should populate header data', () => {
      expect(component.header.driveId).toBe('DRV0172094');
      expect(component.header.driveDate).toBe('05-31-2024');
      expect(component.header.typeDescription).toBe('Fixed');
      expect(component.header.driveType).toBe('F');
      expect(component.header.sponsorId).toBe('SPON046693');
      expect(component.header.sponsorName).toBe('CREEK COMMUNITY');
      expect(component.header.totalDonations).toBe(249);
    });

    it('should populate projection values', () => {
      expect(component.header.projectedShow).toBe(0);
      expect(component.header.projectedDraw).toBe(0);
      expect(component.header.projectedDeferralRate).toBe(12);
      expect(component.header.actualDraw).toBe(61);
      expect(component.header.actualDeferral).toBe(188);
      expect(component.header.deferralRate).toBe(75.5);
    });

    it('should populate donations data', () => {
      expect(component.donations.length).toBe(2);
      expect(component.donations[0].donationType).toBe('AL');
      expect(component.donations[0].procedureCode).toBe('WB');
      expect(component.donations[0].count).toBe(61);
    });

    it('should populate venipuncture data', () => {
      expect(component.venipuncture.length).toBe(2);
      expect(component.venipuncture[0].venipunctureCode).toBe('01');
      expect(component.venipuncture[0].description).toBe('Diff. Stick');
    });

    it('should populate deferrals allogenic data', () => {
      expect(component.deferralsAllogenic.length).toBe(1);
      expect(component.deferralsAllogenic[0].deferralCode).toBe('HDT');
      expect(component.deferralsAllogenic[0].numberOfDeferrals).toBe(24);
    });



    it('should populate unit details data', () => {
      expect(component.unitDetails.length).toBe(1);
      expect(component.unitDetails[0].unitId).toBe('W123424053111');
      expect(component.unitDetails[0].attrib01).toBe('Y');
      expect(component.unitDetails[0].attrib02).toBeNull();
    });

    it('should populate donors list data', () => {
      expect(component.donorsList.length).toBe(2);
      expect(component.donorsList[0].donorId).toBe('DN30133334');
      expect(component.donorsList[0].lastName).toBe('Abbott');
    });



    it('should initialize with first tab selected', () => {
      expect(component.selectedTabIndex).toBe(0);
    });
  });

  describe('formatRate', () => {
    it('should format a numeric rate with percent sign', () => {
      expect(component.formatRate(75.5)).toBe('75.5%');
    });

    it('should return dash for null rate', () => {
      expect(component.formatRate(null)).toBe('—');
    });

    it('should handle zero rate', () => {
      expect(component.formatRate(0)).toBe('0%');
    });
  });

  describe('formatNullable', () => {
    it('should format a number as string', () => {
      expect(component.formatNullable(45)).toBe('45');
    });


  });
  describe('Edge cases', () => {


    it('should handle null deferrals gracefully', fakeAsync(() => {
      const itemWithNullDeferrals = {
        header: mockItem.header,
        donations: [],
        venipuncture: [],
        deferrals: null,
        unitDetails: [],
        donorsList: [],
      } as unknown as DriveStatisticsItem;

      mockService.getDriveStatistics.and.returnValue(of(itemWithNullDeferrals));

      fixture = TestBed.createComponent(DriveStatisticsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.deferralsAllogenic).toEqual([]);
      expect(component.deferralsAutologousTherapeutic).toEqual([]);
      expect(component.loading).toBe(false);
    }));

    it('should handle undefined values in formatRate', () => {
      expect(component.formatRate(undefined as unknown as null)).toBe('—');
    });

    it('should handle undefined values in formatNullable', () => {
      expect(component.formatNullable(undefined as unknown as null)).toBe('—');
    });

    it('should handle null donor field values in sort', () => {
      component.donorsList = [
        { donorId: 'DN001', lastName: null as unknown as string, firstName: 'Kim', sex: 'M' },
        { donorId: 'DN002', lastName: 'Abbott', firstName: 'Jimmy', sex: 'M' },
      ];

      expect(() => {
        component.onDonorSort({ active: 'lastName', direction: 'asc' });
      }).not.toThrow();
    });
  });
});
