import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FindDonorResult } from '@shared/components/find-donor/find-donor.model';
import {
  PotentialDuplicatesDialogComponent,
  PotentialDuplicatesDialogData,
} from './potential-duplicates-dialog';

describe('PotentialDuplicatesDialogComponent', () => {
  let component: PotentialDuplicatesDialogComponent;
  let fixture: ComponentFixture<PotentialDuplicatesDialogComponent>;

  const mockDialogRef = { close: jest.fn() };

  const mockDuplicates: FindDonorResult[] = [
    {
      grade: 95,
      donorId: 'D001',
      lastName: 'DOE',
      firstName: 'JOHN',
      middleName: 'M',
      dob: '1990-01-15',
      sex: 'M',
      aboRh: 'O+',
    },
    {
      grade: 80,
      donorId: 'D002',
      lastName: 'DOE',
      firstName: 'JONATHAN',
      middleName: null,
      dob: '1990-02-20',
      sex: 'M',
      aboRh: null,
    },
  ];

  const mockCurrentDonor = {
    donorId: 'NEW',
    lastName: 'DOE',
    firstName: 'JOHN',
    middleName: 'M',
    dob: '01-15-1990',
    sex: 'M',
    aboRh: 'O+',
    address: '123 MAIN ST',
    phone: '555-1234',
  };

  const defaultData: PotentialDuplicatesDialogData = {
    duplicates: mockDuplicates,
    donorId: 'NEW',
    currentDonor: mockCurrentDonor,
  };

  function setupTestBed(data: PotentialDuplicatesDialogData = defaultData): void {
    TestBed.configureTestingModule({
      imports: [PotentialDuplicatesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(PotentialDuplicatesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => TestBed.resetTestingModule());

  describe('Initialization', () => {
    it('should create the component', () => {
      setupTestBed();
      expect(component).toBeTruthy();
    });

    it('should have correct displayed columns', () => {
      setupTestBed();
      expect(component.displayedColumns).toEqual([
        'grade', 'donorId', 'lastName', 'firstName', 'middleName', 'dob', 'sex', 'aboRh',
      ]);
    });
  });

  describe('allRows', () => {
    it('should include all duplicates plus current donor', () => {
      setupTestBed();
      const rows = component.allRows;
      expect(rows.length).toBe(3);
    });

    it('should map duplicate fields correctly', () => {
      setupTestBed();
      const rows = component.allRows;
      expect(rows[0].grade).toBe(95);
      expect(rows[0].donorId).toBe('D001');
      expect(rows[0].lastName).toBe('DOE');
      expect(rows[0].firstName).toBe('JOHN');
      expect(rows[0].middleName).toBe('M');
      expect(rows[0].sex).toBe('M');
      expect(rows[0].aboRh).toBe('O+');
    });

    it('should format dob as MM-DD-YYYY', () => {
      setupTestBed();
      const rows = component.allRows;
      expect(rows[0].dob).toBe('01-15-1990');
    });

    it('should handle null aboRh with fallback', () => {
      setupTestBed();
      const rows = component.allRows;
      expect(rows[1].aboRh).toBe('No ABO');
    });

    it('should handle null grade', () => {
      setupTestBed({
        ...defaultData,
        duplicates: [{ ...mockDuplicates[0], grade: null }],
      });
      const rows = component.allRows;
      expect(rows[0].grade).toBeNull();
    });

    it('should handle null middleName', () => {
      setupTestBed();
      const rows = component.allRows;
      expect(rows[1].middleName).toBe('');
    });

    it('should handle empty dob', () => {
      setupTestBed({
        ...defaultData,
        duplicates: [{ ...mockDuplicates[0], dob: null }],
      });
      const rows = component.allRows;
      expect(rows[0].dob).toBe('');
    });

    it('should add current donor as last row', () => {
      setupTestBed();
      const rows = component.allRows;
      const lastRow = rows[rows.length - 1];
      expect(lastRow.donorId).toBe('NEW');
      expect(lastRow.grade).toBeNull();
      expect(lastRow.lastName).toBe('DOE');
    });

    it('should handle empty duplicates array', () => {
      setupTestBed({ ...defaultData, duplicates: [] });
      const rows = component.allRows;
      expect(rows.length).toBe(1);
      expect(rows[0].donorId).toBe('NEW');
    });

    it('should handle missing optional fields on duplicates', () => {
      setupTestBed({
        ...defaultData,
        duplicates: [{ donorId: 'D003' }],
      });
      const rows = component.allRows;
      expect(rows[0].lastName).toBe('');
      expect(rows[0].firstName).toBe('');
      expect(rows[0].sex).toBe('');
    });

    it('should use current donor aboRh fallback for No ABO', () => {
      setupTestBed({
        ...defaultData,
        currentDonor: { ...mockCurrentDonor, aboRh: '' },
      });
      const rows = component.allRows;
      const lastRow = rows[rows.length - 1];
      expect(lastRow.aboRh).toBe('No ABO');
    });
  });

  describe('onClose', () => {
    it('should close dialog with true', () => {
      setupTestBed();
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
