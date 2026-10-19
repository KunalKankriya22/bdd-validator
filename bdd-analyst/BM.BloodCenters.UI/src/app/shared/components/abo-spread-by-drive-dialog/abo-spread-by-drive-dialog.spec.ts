import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AboSpreadByDriveDialogComponent, AboSpreadByDriveData } from './abo-spread-by-drive-dialog';
import { AboSpreadService, AboSpreadResponse, AboSpreadRow, DonationTypeOption } from '@shared/services/abo-spread.service';

describe('AboSpreadByDriveDialogComponent', () => {
  let aboSpreadServiceSpy: any;
  let dialogRefSpy: any;
  let component: AboSpreadByDriveDialogComponent;
  let fixture: ComponentFixture<AboSpreadByDriveDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AboSpreadByDriveDialogComponent>>;
  let mockAboSpreadService: jasmine.SpyObj<AboSpreadService>;

  const mockDialogData: AboSpreadByDriveData = {
    driveId: 'DRV001',
    chapterId: 'TX01',
  };

  const mockSpreadResponse: AboSpreadResponse = {
    rows: [
      {
        procedureCode: 'WB',
        procedureCodeDescription: 'Whole Blood',
        total: 100,
        oPos: 38, oNeg: 7, aPos: 33, aNeg: 6,
        bPos: 9, bNeg: 2, abPos: 3, abNeg: 1, unknown: 1,
      },
      {
        procedureCode: 'PLT',
        procedureCodeDescription: 'Platelet',
        total: 50,
        oPos: 19, oNeg: 4, aPos: 16, aNeg: 3,
        bPos: 4, bNeg: 1, abPos: 2, abNeg: 0, unknown: 1,
      },
    ],
    totals: {
      total: 150, oPos: 57, oNeg: 11, aPos: 49, aNeg: 9,
      bPos: 13, bNeg: 3, abPos: 5, abNeg: 1, unknown: 2,
    },
    percentages: {
      total: 100, oPos: 38, oNeg: 7.3, aPos: 32.7, aNeg: 6,
      bPos: 8.7, bNeg: 2, abPos: 3.3, abNeg: 0.7, unknown: 1.3,
    },
    unknownAbo: 2,
  };

  const mockDonationTypes: DonationTypeOption[] = [
    { donationType: 'WB', description: 'Whole Blood' },
    { donationType: 'PLT', description: 'Platelet' },
  ];

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    aboSpreadServiceSpy = jasmine.createSpyObj('AboSpreadService', [
      'getAboSpreadByDrive',
      'getDonationTypesByDrive',
      'getAboSpreadBySponsor',
      'getDrivesBySponsor',
      'getDonationTypesBySponsor',
    ]);

    aboSpreadServiceSpy.getAboSpreadByDrive.and.returnValue(of(mockSpreadResponse));
    aboSpreadServiceSpy.getDonationTypesByDrive.and.returnValue(of(mockDonationTypes));

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        AboSpreadByDriveDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AboSpreadService, useValue: aboSpreadServiceSpy },
      ],
    });

    dialogRefSpy.close.calls.reset();
    aboSpreadServiceSpy.getAboSpreadByDrive.calls.reset();
    aboSpreadServiceSpy.getDonationTypesByDrive.calls.reset();
    aboSpreadServiceSpy.getAboSpreadBySponsor.calls.reset();
    aboSpreadServiceSpy.getDrivesBySponsor.calls.reset();
    aboSpreadServiceSpy.getDonationTypesBySponsor.calls.reset();
    aboSpreadServiceSpy.getAboSpreadByDrive.and.returnValue(of(mockSpreadResponse));
    aboSpreadServiceSpy.getDonationTypesByDrive.and.returnValue(of(mockDonationTypes));

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AboSpreadByDriveDialogComponent>>;
    mockAboSpreadService = TestBed.inject(AboSpreadService) as jasmine.SpyObj<AboSpreadService>;
    fixture = TestBed.createComponent(AboSpreadByDriveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should initialize with default donation type AL', () => {
      expect(component.selectedDonationType).toBe('AL');
    });

    it('should load spread data on init', () => {
      expect(mockAboSpreadService.getAboSpreadByDrive).toHaveBeenCalledWith('DRV001', 'AL');
    });

    it('should populate donation types dropdown with ALL option first', () => {
      expect(component.donationTypes.length).toBe(3);
      expect(component.donationTypes[0].value).toBe('AL');
      expect(component.donationTypes[0].label).toBe('All Donation Types');
      expect(component.donationTypes[1].value).toBe('WB');
      expect(component.donationTypes[2].value).toBe('PLT');
    });

    it('should set unknownAbo', () => {
      expect(component.unknownAbo).toBe(2);
    });
  });

  describe('Donation type change', () => {
    it('should reload spread data when donation type changes', () => {
      mockAboSpreadService.getAboSpreadByDrive.calls.reset();
      component.selectedDonationType = 'WB';

      component.onDonationTypeChange();

      expect(mockAboSpreadService.getAboSpreadByDrive).toHaveBeenCalledWith('DRV001', 'WB');
    });
  });

  describe('Sorting', () => {
    it('should sort data source descending by default', () => {
      // desc: W before P
      const firstCode = component.dataSource[0].procedureCodeDescription.toLowerCase();
      const secondCode = component.dataSource[1].procedureCodeDescription.toLowerCase();
      expect(firstCode >= secondCode).toBe(true);
    });

    it('should sort data source ascending after toggle', () => {
      component.toggleSort();

      const firstCode = component.dataSource[0].procedureCodeDescription.toLowerCase();
      const secondCode = component.dataSource[1].procedureCodeDescription.toLowerCase();
      expect(firstCode <= secondCode).toBe(true);
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
      mockAboSpreadService.getAboSpreadByDrive.and.returnValue(of(response));
      component.selectedDonationType = 'WB';
      component.onDonationTypeChange();

      expect(component.dataSource[0].procedureCode).toBe('ZZZ');

      component.toggleSort();
      expect(component.dataSource[0].procedureCode).toBe('AAA');
    });
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

  describe('Error handling', () => {
    it('should set loading to false when loadSpreadData errors', () => {
      mockAboSpreadService.getAboSpreadByDrive.and.returnValue(throwError(() => new Error('API error')));

      component.selectedDonationType = 'WB';
      component.onDonationTypeChange();

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
      mockAboSpreadService.getDonationTypesByDrive.and.returnValue(of(typesWithEmpty));

      fixture = TestBed.createComponent(AboSpreadByDriveDialogComponent);
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

    it('should receive dialog data with driveId', () => {
      expect(component.data.driveId).toBe('DRV001');
      expect(component.data.chapterId).toBe('TX01');
    });

    it('should populate dataSource from response', () => {
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].total).toBeDefined();
    });

    it('should populate totals from response', () => {
      expect(component.totals.total).toBe(150);
      expect(component.totals.oPos).toBe(57);
    });

    it('should populate percentages from response', () => {
      expect(component.percentages.total).toBe(100);
      expect(component.percentages.oPos).toBe(38);
    });
  });
});
