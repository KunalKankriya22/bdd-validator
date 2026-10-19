import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DonationsDialog, DonationsDialogData } from './donations-dialog';
import { CommunicationRecord } from '../models/donor-communication-query.model';

describe('DonationsDialog', () => {
  let component: DonationsDialog;
  let fixture: ComponentFixture<DonationsDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DonationsDialog>>;

  const mockCommunication: CommunicationRecord = {
    donorId: '1234567890',
    comType: 'MAIL',
    comCode: 'THANK',
    insertUser: 'USER01',
    insertDate: '2024-06-15T10:30:00Z',
    actionCode: 'SENT',
    name: 'Doe, John M',
    dob: '01-15-1985',
    sex: 'M',
    abo: 'O+',
    targetDate: '06-25-2024',
    actionDate: '06-15-2024',
    comDesc: 'Follow-up completed',
    chapterId: 'CH001',
  };

  const mockDialogData: DonationsDialogData = {
    communication: mockCommunication,
  };

  beforeEach(() => {

    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [DonationsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      dialogRef.close.calls.reset();


    fixture = TestBed.createComponent(DonationsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {


    it('should initialize communication data from dialog data', () => {
      expect(component['communication']).toEqual(mockCommunication);
    });

    it('should initialize footer buttons with CLOSE button', () => {
      expect(component['footerButtons'].length).toBe(1);
      expect(component['footerButtons'][0].label).toBe('CLOSE');
      expect(component['footerButtons'][0].action).toBe('close');
      expect(component['footerButtons'][0].variant).toBe('text');
    });
  });

  // ==================== Date Formatting ====================

  describe('Date Formatting (formatDate)', () => {
    it('should format valid date string to DD-MMM-YYYY uppercase', () => {
      const formatted = component.formatDate('2024-06-15T10:30:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return en dash for undefined input', () => {
      const formatted = component.formatDate(undefined);
      expect(formatted).toBe('–');
    });

    it('should return en dash for null input', () => {
      const formatted = component.formatDate(null as any);
      expect(formatted).toBe('–');
    });





    it('should format ISO date string correctly', () => {
      const formatted = component.formatDate('2024-12-25T00:00:00Z');
      expect(formatted).toBe('25-DEC-2024');
    });

    it('should format date with uppercase month abbreviation', () => {
      const formatted = component.formatDate('2024-01-15T00:00:00Z');
      expect(formatted).toContain('JAN');
    });
  });

  // ==================== Dialog Actions ====================
  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle communication with null optional fields', () => {
      const dataWithNulls: DonationsDialogData = {
        communication: {
          ...mockCommunication,
          actionCode: null,
          targetDate: null,
          actionDate: null,
          comDesc: null,
        },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DonationsDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNulls },
        ],
      });

      const newFixture = TestBed.createComponent(DonationsDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent['communication'].actionCode).toBeNull();
      expect(newComponent['communication'].targetDate).toBeNull();
      expect(newComponent['communication'].actionDate).toBeNull();
      expect(newComponent['communication'].comDesc).toBeNull();
    });

    it('should handle formatDate with leap year dates correctly', () => {
      const formatted = component.formatDate('2024-02-29T00:00:00Z');
      expect(formatted).toBe('29-FEB-2024');
    });

    it('should handle formatDate with various date formats', () => {
      expect(component.formatDate('2024-06-15')).toContain('JUN');
      expect(component.formatDate('2024-06-15T10:30:00')).toContain('JUN');
      expect(component.formatDate('2024-06-15T10:30:00.000Z')).toContain('JUN');
    });
  });
});
