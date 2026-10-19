import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceHistoryDetailsDialogComponent } from './service-history-details-dialog';
import { ServiceHistoryModel } from '../models/service-history-query.model';

describe('ServiceHistoryDetailsDialogComponent', () => {
  let component: ServiceHistoryDetailsDialogComponent;
  let fixture: ComponentFixture<ServiceHistoryDetailsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ServiceHistoryDetailsDialogComponent>>;

  const mockServiceHistoryData: ServiceHistoryModel = {
    eventReference: 'EVT-001',
    equipType: 'CENT',
    equipId: 'CENT-001',
    equipReference: 'REF-001',
    equipStatus: 'IN',
    serviceDescription: 'Routine maintenance',
    serviceStart: '2025-01-01T10:00:00',
    serviceEnd: '2025-01-01T12:00:00',
    downtimeFlag: 'Y',
    scheduledEvent: 'Y',
    downtimeCode: 'MAINT',
    downtimeDescription: 'Maintenance',
    downtimeStart: '2025-01-01T10:00:00',
    downtimeEnd: '2025-01-01T12:00:00',
    serviceCode: 'PREV',
    servicePerson: 'John Doe',
    serviceCompany: 'Service Co',
    qcReference: 'QC-001'
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
imports: [
        ServiceHistoryDetailsDialogComponent,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockServiceHistoryData }
      ]
    });


    });



  beforeEach(() => {


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(ServiceHistoryDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should have dialog ref', () => {
      expect(component.dialogRef).toBe(mockDialogRef);
    });
  });
  describe('formatDateTime', () => {
    it('should format valid date time correctly', () => {
      const dateTime = new Date('2025-01-15T14:30:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('15-JAN-2025');
      expect(formatted).toContain('14:30');
    });

    it('should format date time string correctly', () => {
      const dateTime = '2025-02-20T09:45:00';
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('20-FEB-2025');
      expect(formatted).toContain('09:45');
    });




    it('should pad single digit day correctly', () => {
      const dateTime = new Date('2025-01-05T10:00:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('05-JAN-2025');
    });

    it('should pad single digit hours correctly', () => {
      const dateTime = new Date('2025-01-15T05:30:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('05:30');
    });

    it('should pad single digit minutes correctly', () => {
      const dateTime = new Date('2025-01-15T14:05:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('14:05');
    });

    it('should format all months correctly', () => {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      monthNames.forEach((month, index) => {
        const dateTime = new Date(2025, index, 15, 10, 30, 0);
        const formatted = component.formatDateTime(dateTime);

        expect(formatted).toContain(`15-${month}-2025`);
      });
    });

    it('should format midnight correctly', () => {
      const dateTime = new Date('2025-01-15T00:00:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('00:00');
    });

    it('should format end of day correctly', () => {
      const dateTime = new Date('2025-01-15T23:59:00');
      const formatted = component.formatDateTime(dateTime);

      expect(formatted).toContain('23:59');
    });
  });

  describe('Dialog Data Display', () => {
    it('should display equipment information', () => {
      expect(component.data.equipType).toBe('CENT');
      expect(component.data.equipId).toBe('CENT-001');
      expect(component.data.equipReference).toBe('REF-001');
    });

    it('should display service information', () => {
      expect(component.data.serviceDescription).toBe('Routine maintenance');
      expect(component.data.servicePerson).toBe('John Doe');
      expect(component.data.serviceCompany).toBe('Service Co');
    });

    it('should display downtime information', () => {
      expect(component.data.downtimeFlag).toBe('Y');
      expect(component.data.downtimeCode).toBe('MAINT');
      expect(component.data.downtimeDescription).toBe('Maintenance');
    });

  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const emptyData: ServiceHistoryModel = {
        eventReference: 'EVT-002'
      };

      component.data = emptyData;
      fixture.detectChanges();

      expect(component.data.eventReference).toBe('EVT-002');
      expect(component.data.equipType).toBeUndefined();
    });

  });

  describe('Dialog Actions', () => {
    it('should close dialog when close is called', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should return dash for null dateTime', () => {
      const result = component.formatDateTime(null);
      expect(result).toBe('-');
    });

    it('should return dash for undefined dateTime', () => {
      const result = component.formatDateTime(undefined);
      expect(result).toBe('-');
    });

    it('should return dash for invalid dateTime string', () => {
      const result = component.formatDateTime('invalid-date');
      expect(result).toBe('-');
    });
  });
});
