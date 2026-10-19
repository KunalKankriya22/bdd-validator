import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { UnitTransferToTransfusionComponent } from './unit-transfer-to-transfusion';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitTransferToTransfusionService } from './unit-transfer-to-transfusion.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('UnitTransferToTransfusionComponent', () => {
  let component: UnitTransferToTransfusionComponent;
  let fixture: ComponentFixture<UnitTransferToTransfusionComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let transferServiceSpy: jasmine.SpyObj<UnitTransferToTransfusionService>;

  const mockFacilities = [
    { code: 'FAC01', description: 'Main Blood Center' },
    { code: 'FAC02', description: 'Satellite Collection Site' },
  ];

  const mockTransferResponse = {
    success: true,
    message: 'Transfer Completed',
    statusCode: 200,
    data: [
      {
        facilityName: 'Main Blood Center',
        processStartTime: '2026-05-29T10:30:00',
        processEndTime: '2026-05-29T10:30:02',
        status: 'Success',
        message: 'Transfer Completed',
      },
    ],
    total: 1,
  };

  const mockPageHeaderService = {
    pageHeaderData: signal({
      title: 'Unit Transfer to Transfusion System',
      subtitle: 'Move data for labeled products from Lab to Transfusion in a batch process.',
    }),
  };

  const mockHeaderService = {
    chapterChanged$: new Subject<void>(),
  };

  beforeEach(() => {

    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();
    transferServiceSpy = jasmine.createSpyObj('UnitTransferToTransfusionService', [
      'getFacilities',
      'executeTransfer',
    ]);

    transferServiceSpy.getFacilities.and.returnValue(of(mockFacilities));
    transferServiceSpy.executeTransfer.and.returnValue(of(mockTransferResponse));



      TestBed.configureTestingModule({
imports: [UnitTransferToTransfusionComponent],
      providers: [
        provideRouter([]),
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: UnitTransferToTransfusionService, useValue: transferServiceSpy },
      ],
    })
    .overrideComponent(UnitTransferToTransfusionComponent, {
      remove: { imports: [MatDialogModule, MatSnackBarModule] },
    });


    });



  beforeEach(() => {


      transferServiceSpy.getFacilities.calls.reset();


      transferServiceSpy.executeTransfer.calls.reset();


      transferServiceSpy.getFacilities.and.returnValue(of(mockFacilities));


      transferServiceSpy.executeTransfer.and.returnValue(of(mockTransferResponse));


    fixture = TestBed.createComponent(UnitTransferToTransfusionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize with idle status and empty time values', () => {
    expect(component.processStatus()).toBe('idle');
    expect(component.processStartTime()).toBe('--:--');
    expect(component.processEndTime()).toBe('--:--');
  });

  it('should load facilities from service on init', () => {
    expect(transferServiceSpy.getFacilities).toHaveBeenCalled();
    expect(component.receivingFacilities().length).toBe(2);
    expect(component.receivingFacilities().some(f => f.code === 'FAC01')).toBeTrue();
    expect(component.receivingFacilities().some(f => f.code === 'FAC02')).toBeTrue();
  });

  it('should initialize facility control as null and required', () => {
    expect(component.facilityControl.value).toBeNull();
    expect(component.facilityControl.hasValidator(Validators.required)).toBeTrue();
  });





  it('should call executeTransfer with facilityId and set complete status on success', () => {
    const dialogRefMock = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
    dialogSpy.open.and.returnValue(dialogRefMock);
    component.facilityControl.setValue('FAC01');

    component.onFacilityChange('FAC01');
    fixture.detectChanges();

    expect(transferServiceSpy.executeTransfer).toHaveBeenCalledWith('FAC01');
    expect(component.processStatus()).toBe('complete');
    expect(component.processStartTime()).not.toBe('--:--');
    expect(component.processEndTime()).not.toBe('--:--');
  });


  it('should reset to idle and show error snackbar when transfer fails', () => {
    transferServiceSpy.executeTransfer.and.returnValue(throwError(() => new Error('server error')));
    const dialogRefMock = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
    dialogSpy.open.and.returnValue(dialogRefMock);
    component.facilityControl.setValue('FAC01');

    component.onFacilityChange('FAC01');
    fixture.detectChanges();

    expect(component.processStatus()).toBe('idle');
    expect(component.processStartTime()).toBe('--:--');
    expect(component.processEndTime()).toBe('--:--');
    expect(component.facilityControl.value).toBeNull();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Transfer failed. Please try again.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  });


  it('should show success snackbar and reset form on onTransferOk', () => {
    component.processStatus.set('complete');
    component.processStartTime.set('29-MAY-2026 10:30');
    component.processEndTime.set('29-MAY-2026 10:30');

    component.onTransferOk();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Transfer complete.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
    expect(component.processStatus()).toBe('idle');
    expect(component.processStartTime()).toBe('--:--');
    expect(component.processEndTime()).toBe('--:--');
    expect(component.facilityControl.value).toBeNull();
  });

  it('should reset form on clearForm', () => {
    component.facilityControl.setValue('FAC01');
    component.processStatus.set('complete');

    component.clearForm();

    expect(component.facilityControl.value).toBeNull();
    expect(component.processStatus()).toBe('idle');
    expect(component.processStartTime()).toBe('--:--');
    expect(component.processEndTime()).toBe('--:--');
  });



  it('should render process start and end time labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = compiled.querySelectorAll('.status-label');
    const labelTexts = Array.from(labels).map(l => l.textContent?.trim());
    expect(labelTexts).toContain('Process Start Time');
    expect(labelTexts).toContain('Process End Time');
  });
});
