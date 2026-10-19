import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { UploadedDataDialog } from './uploaded-data-dialog';
import { VistaInterfaceStatusService } from '../../services/vista-interface-status.service';
import { IdpTargetChangeDto } from '../../models/vista-interface-status.model';

describe('UploadedDataDialog', () => {
  let component: any;
  let fixture: ComponentFixture<UploadedDataDialog>;
  let vistaServiceSpy: jasmine.SpyObj<VistaInterfaceStatusService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UploadedDataDialog>>;

  const mockUploadedData: IdpTargetChangeDto[] = [
    { targetChangeId: 1, targetSystem: 'VISTA', targetId: 'TRX001', targetTable: 'DONATIONS', targetField: 'DONOR_ID', targetValue: 'DON123', targetChangeDate: '2025-01-15T09:37:00' },
    { targetChangeId: 2, targetSystem: 'VISTA', targetId: 'TRX001', targetTable: 'DONATIONS', targetField: 'UNIT_ID', targetValue: 'U001', targetChangeDate: '2025-01-15T09:37:00' },
    { targetChangeId: 3, targetSystem: 'VISTA', targetId: 'TRX001', targetTable: 'DONATIONS', targetField: 'BLEED_START_TIME', targetValue: '09:37', targetChangeDate: '2025-01-15T09:37:00' },
  ];

  const mockDialogData = { transactionId: 'TRX001' };

  beforeEach(() => {

    vistaServiceSpy = jasmine.createSpyObj('VistaInterfaceStatusService', ['getUploadedData']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    vistaServiceSpy.getUploadedData.and.returnValue(of(mockUploadedData));



      TestBed.configureTestingModule({
      imports: [UploadedDataDialog, NoopAnimationsModule],
      providers: [
        { provide: VistaInterfaceStatusService, useValue: vistaServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    


      vistaServiceSpy.getUploadedData.calls.reset();


      dialogRefSpy.close.calls.reset();


      vistaServiceSpy.getUploadedData.and.returnValue(of(mockUploadedData));


    fixture = TestBed.createComponent(UploadedDataDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should load uploaded data on init', () => {
      expect(vistaServiceSpy.getUploadedData).toHaveBeenCalledWith('TRX001');
    });

    it('should set error if transaction ID is missing', () => {
      const fixture2 = TestBed.createComponent(UploadedDataDialog);
      const component2 = fixture2.componentInstance;
      component2.dialogData = { transactionId: '' };

      component2.ngOnInit();

      expect(component2.error()).toBe('Transaction ID is required');
    });

    it('should map IDP_TARGET_CHANGE records to field/value pairs', () => {
      const fields = component.uploadedDataFields();
      expect(fields.length).toBe(3);
      expect(fields[0]).toEqual({ label: 'DONOR_ID', value: 'DON123' });
      expect(fields[1]).toEqual({ label: 'UNIT_ID', value: 'U001' });
      expect(fields[2]).toEqual({ label: 'BLEED_START_TIME', value: '09:37' });
    });


  });

  describe('Data Loading', () => {




    it('should handle API error without message', () => {
      vistaServiceSpy.getUploadedData.and.returnValue(
        throwError(() => ({}))
      );

      const fixture2 = TestBed.createComponent(UploadedDataDialog);
      const component2 = fixture2.componentInstance;
      fixture2.detectChanges();

      expect(component2.error()).toBe('Failed to load uploaded data');
    });
  });
  describe('Uploaded Data Fields', () => {
    it('should include all IDP_TARGET_CHANGE fields', () => {
      const fields = component.uploadedDataFields();
      const fieldLabels = fields.map((f: any) => f.label);

      expect(fieldLabels).toContain('DONOR_ID');
      expect(fieldLabels).toContain('UNIT_ID');
      expect(fieldLabels).toContain('BLEED_START_TIME');
    });

    it('should map targetField to label and targetValue to value', () => {
      const fields = component.uploadedDataFields();
      const donorField = fields.find((f: any) => f.label === 'DONOR_ID');

      expect(donorField?.value).toBe('DON123');
    });

    it('should handle empty uploaded data', () => {
      vistaServiceSpy.getUploadedData.and.returnValue(of([]));

      const fixture2 = TestBed.createComponent(UploadedDataDialog);
      fixture2.detectChanges();
      const component2: any = fixture2.componentInstance;

      expect(component2.uploadedDataFields().length).toBe(0);
    });
  });
  describe('Error State', () => {
    it('should show error message when error exists', () => {
      component.error.set('Test error');
      component.loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain('Test error');
    });


  });
  describe('Accessibility', () => {




    it('should generate unique IDs across instances', () => {
      const fixture2 = TestBed.createComponent(UploadedDataDialog);
      const component2: any = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
    });
  });
});
