import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AboSpreadBySponsorDialogComponent, AboSpreadBySponsorData } from './abo-spread-by-sponsor-dialog';
import { AboSpreadService, AboSpreadResponse, AboSpreadRow, DonationTypeOption, SponsorDriveOption } from '@shared/services/abo-spread.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AboSpreadBySponsorDialogComponent', () => {
  let aboSpreadServiceSpy: any;
  let dialogRefSpy: any;
  let headerServiceSpy: any;
  let component: AboSpreadBySponsorDialogComponent;
  let fixture: ComponentFixture<AboSpreadBySponsorDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AboSpreadBySponsorDialogComponent>>;
  let mockAboSpreadService: jasmine.SpyObj<AboSpreadService>;

  const mockDialogData: AboSpreadBySponsorData = {
    sponsorId: 'SPO001',
    chapterId: 'TX01',
  };

  const mockSpreadResponse: AboSpreadResponse = {
    rows: [
      {
        procedureCode: 'WB',
        procedureCodeDescription: 'Whole Blood',
        total: 200,
        oPos: 76, oNeg: 14, aPos: 66, aNeg: 12,
        bPos: 18, bNeg: 4, abPos: 6, abNeg: 2, unknown: 2,
      },
    ],
    totals: {
      total: 200, oPos: 76, oNeg: 14, aPos: 66, aNeg: 12,
      bPos: 18, bNeg: 4, abPos: 6, abNeg: 2, unknown: 2,
    },
    percentages: {
      total: 100, oPos: 38, oNeg: 7, aPos: 33, aNeg: 6,
      bPos: 9, bNeg: 2, abPos: 3, abNeg: 1, unknown: 1,
    },
    unknownAbo: 2,
  };

  const mockDonationTypes: DonationTypeOption[] = [
    { donationType: 'WB', description: 'Whole Blood' },
    { donationType: 'PLT', description: 'Platelet' },
  ];

  const mockSponsorDrives: SponsorDriveOption[] = [
    { driveId: 'DRV001', driveDate: '2025-05-01', label: '05-01-2025    DRV001' },
    { driveId: 'DRV002', driveDate: '2025-04-15', label: '04-15-2025    DRV002' },
    { driveId: 'DRV003', driveDate: '2025-03-01', label: '03-01-2025    DRV003' },
  ];

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    headerServiceSpy = createMockHeaderService();
    aboSpreadServiceSpy = jasmine.createSpyObj('AboSpreadService', [
      'getAboSpreadByDrive',
      'getDonationTypesByDrive',
      'getAboSpreadBySponsor',
      'getDrivesBySponsor',
      'getDonationTypesBySponsor',
    ]);

    aboSpreadServiceSpy.getAboSpreadBySponsor.and.returnValue(of(mockSpreadResponse));
    aboSpreadServiceSpy.getDonationTypesBySponsor.and.returnValue(of(mockDonationTypes));
    aboSpreadServiceSpy.getDrivesBySponsor.and.returnValue(of(mockSponsorDrives));

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        AboSpreadBySponsorDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AboSpreadService, useValue: aboSpreadServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    dialogRefSpy.close.calls.reset();
    aboSpreadServiceSpy.getAboSpreadByDrive.calls.reset();
    aboSpreadServiceSpy.getDonationTypesByDrive.calls.reset();
    aboSpreadServiceSpy.getAboSpreadBySponsor.calls.reset();
    aboSpreadServiceSpy.getDrivesBySponsor.calls.reset();
    aboSpreadServiceSpy.getDonationTypesBySponsor.calls.reset();
    aboSpreadServiceSpy.getAboSpreadBySponsor.and.returnValue(of(mockSpreadResponse));
    aboSpreadServiceSpy.getDonationTypesBySponsor.and.returnValue(of(mockDonationTypes));
    aboSpreadServiceSpy.getDrivesBySponsor.and.returnValue(of(mockSponsorDrives));

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AboSpreadBySponsorDialogComponent>>;
    mockAboSpreadService = TestBed.inject(AboSpreadService) as jasmine.SpyObj<AboSpreadService>;
    fixture = TestBed.createComponent(AboSpreadBySponsorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should initialize with default donation type AL', () => {
      expect(component.selectedDonationType).toBe('AL');
    });

    it('should initialize with default drive selection ALL', () => {
      expect(component.selectedDrive).toBe('ALL');
    });

    it('should load drives on init', () => {
      expect(mockAboSpreadService.getDrivesBySponsor).toHaveBeenCalledWith('SPO001', 'TST');
    });

    it('should load spread data on init', () => {
      expect(mockAboSpreadService.getAboSpreadBySponsor).toHaveBeenCalledWith('SPO001', 'AL', []);
    });

    it('should populate donation types dropdown with ALL option first', () => {
      expect(component.donationTypes.length).toBe(3);
      expect(component.donationTypes[0].value).toBe('AL');
      expect(component.donationTypes[0].label).toBe('All Donation Types');
      expect(component.donationTypes[1].label).toBe('WB - Whole Blood');
      expect(component.donationTypes[2].label).toBe('PLT - Platelet');
    });

    it('should populate drives dropdown with ALL option first', () => {
      expect(component.drivesEvaluated.length).toBe(4);
      expect(component.drivesEvaluated[0].value).toBe('ALL');
      expect(component.drivesEvaluated[0].label).toBe('All Drives');
      expect(component.drivesEvaluated[1].value).toBe('DRV001');
    });

    it('should populate totals', () => {
      expect(component.totals.total).toBe(200);
    });

    it('should populate percentages', () => {
      expect(component.percentages.total).toBe(100);
    });

    it('should set unknownAbo', () => {
      expect(component.unknownAbo).toBe(2);
    });
  });

  describe('Donation type change', () => {
    it('should reload spread data when donation type changes', () => {
      mockAboSpreadService.getAboSpreadBySponsor.calls.reset();
      component.selectedDonationType = 'WB';

      component.onDonationTypeChange();

      expect(mockAboSpreadService.getAboSpreadBySponsor).toHaveBeenCalledWith('SPO001', 'WB', []);
    });
  });

  describe('Sorting', () => {
    it('should sort data source when toggled', () => {
      const initialOrder = [...component.dataSource];

      component.toggleSort();

      expect(component.dataSource).toBeDefined();
      expect(component.dataSource.length).toBe(initialOrder.length);
    });

    it('should toggle sort direction back to desc', () => {
      component.toggleSort();
      expect(component.sortDirection).toBe('asc');

      component.toggleSort();
      expect(component.sortDirection).toBe('desc');
    });

    it('should sort using procedureCode when procedureCodeDescription is empty', () => {
      const rowsWithoutDesc: AboSpreadRow[] = [
        {
          procedureCode: 'ZZZ', procedureCodeDescription: '',
          total: 10, oPos: 4, oNeg: 1, aPos: 3, aNeg: 1, bPos: 1, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0,
        },
        {
          procedureCode: 'AAA', procedureCodeDescription: '',
          total: 5, oPos: 2, oNeg: 1, aPos: 1, aNeg: 0, bPos: 1, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0,
        },
      ];
      const response: AboSpreadResponse = {
        rows: rowsWithoutDesc,
        totals: mockSpreadResponse.totals,
        percentages: mockSpreadResponse.percentages,
        unknownAbo: 0,
      };
      mockAboSpreadService.getAboSpreadBySponsor.and.returnValue(of(response));
      component.loadSpreadData();

      expect(component.dataSource[0].procedureCode).toBe('ZZZ');

      component.toggleSort();
      expect(component.dataSource[0].procedureCode).toBe('AAA');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty spread data', fakeAsync(() => {
      const emptyResponse: AboSpreadResponse = {
        rows: [],
        totals: { total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0 },
        percentages: { total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0 },
        unknownAbo: 0,
      };

      mockAboSpreadService.getAboSpreadBySponsor.and.returnValue(of(emptyResponse));

      fixture = TestBed.createComponent(AboSpreadBySponsorDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.dataSource.length).toBe(0);
      expect(component.totals.total).toBe(0);
      expect(component.unknownAbo).toBe(0);
    }));
  });

  describe('Close dialog', () => {
    it('should close the dialog when onClose is called', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Donation type search filtering', () => {
    it('should filter donation types by search term matching label', () => {
      component.donationTypeSearchControl.setValue('Whole');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].value).toBe('WB');
    });

    it('should filter donation types by search term matching value', () => {
      component.donationTypeSearchControl.setValue('PLT');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].value).toBe('PLT');
    });

    it('should show all donation types when search is cleared', () => {
      component.donationTypeSearchControl.setValue('Whole');
      expect(component.filteredDonationTypes.length).toBe(1);

      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes.length).toBe(3);
    });

    it('should handle null search value', () => {
      component.donationTypeSearchControl.setValue(null);
      expect(component.filteredDonationTypes.length).toBe(3);
    });
  });

  describe('Drive selection', () => {
    it('should pass specific drive ID when a drive is selected', () => {
      mockAboSpreadService.getAboSpreadBySponsor.calls.reset();
      component.selectedDrive = 'DRV001';

      component.loadSpreadData();

      expect(mockAboSpreadService.getAboSpreadBySponsor).toHaveBeenCalledWith('SPO001', 'AL', ['DRV001']);
    });

    it('should pass empty array when ALL drives selected', () => {
      mockAboSpreadService.getAboSpreadBySponsor.calls.reset();
      component.selectedDrive = 'ALL';

      component.loadSpreadData();

      expect(mockAboSpreadService.getAboSpreadBySponsor).toHaveBeenCalledWith('SPO001', 'AL', []);
    });
  });

  describe('Error handling', () => {
    it('should set loading to false when loadSpreadData errors', () => {
      mockAboSpreadService.getAboSpreadBySponsor.and.returnValue(throwError(() => new Error('API error')));

      component.loadSpreadData();

      expect(component.loading).toBe(false);
    });
  });

  describe('Donation type label formatting', () => {
    it('should format donation type with description', () => {
      expect(component.donationTypes[1].label).toBe('WB - Whole Blood');
    });

    it('should use only donation type code when description is empty', () => {
      const typesWithEmpty: DonationTypeOption[] = [
        { donationType: 'RBC', description: '' },
      ];
      mockAboSpreadService.getDonationTypesBySponsor.and.returnValue(of(typesWithEmpty));

      fixture = TestBed.createComponent(AboSpreadBySponsorDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.donationTypes[1].label).toBe('RBC');
    });
  });

  describe('Data binding', () => {
    it('should have access to dialogRef', () => {
      expect(component.dialogRef).toBeDefined();
      expect(component.dialogRef).toBe(dialogRef);
    });

    it('should receive dialog data with sponsorId', () => {
      expect(component.data.sponsorId).toBe('SPO001');
      expect(component.data.chapterId).toBe('TX01');
    });

    it('should populate dataSource from response', () => {
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].procedureCode).toBe('WB');
    });
  });
});
