import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { PrintPackListDialogComponent, PrintPackListDialogData } from './print-pack-list-dialog';
import { TubeCheckinShipmentService } from '../services/tube-checkin-shipment.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

describe('PrintPackListDialogComponent', () => {
  let component: PrintPackListDialogComponent;
  let fixture: ComponentFixture<PrintPackListDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PrintPackListDialogComponent>>;
  let tubeServiceSpy: jasmine.SpyObj<TubeCheckinShipmentService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: PrintPackListDialogData = {
    boxId: 'BOX001',
    box: {
      boxId: 'BOX001',
      collDate: '2025-01-15',
      extractType: 'V',
      donorType: 'R',
      destinationCode: 'DEST01',
      status: 'Closed',
    } as any,
  };

  const mockTubes = [
    { unitId: 'U001', redTubeFlag: 'Y', purpleTubeFlag: 'N', purpleTube2Flag: 'N' },
    { unitId: 'U002', redTubeFlag: 'N', purpleTubeFlag: 'Y', purpleTube2Flag: 'Y' },
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    tubeServiceSpy = jasmine.createSpyObj('TubeCheckinShipmentService', ['getBoxUnits']);
    tubeServiceSpy.getBoxUnits.and.returnValue(of(mockTubes as any));
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [PrintPackListDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: TubeCheckinShipmentService, useValue: tubeServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintPackListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tubes on init', () => {
    expect(tubeServiceSpy.getBoxUnits).toHaveBeenCalledWith('BOX001', jasmine.any(String));
    expect(component.tubes.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should compute redTopCount correctly', () => {
    expect(component.redTopCount).toBe(1);
  });

  it('should compute purpleTop1Count correctly', () => {
    expect(component.purpleTop1Count).toBe(1);
  });

  it('should compute purpleTop2Count correctly', () => {
    expect(component.purpleTop2Count).toBe(1);
  });

  it('should compute totalTubeCount correctly', () => {
    expect(component.totalTubeCount).toBe(3);
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should handle error when loading tubes fails', fakeAsync(() => {
    tubeServiceSpy.getBoxUnits.and.returnValue(throwError(() => new Error('fail')));

    const newFixture = TestBed.createComponent(PrintPackListDialogComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    tick();

    expect(newComponent.isLoading).toBeFalse();
    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load tubes for printing');
  }));

  it('should show error when popup is blocked on print', () => {
    spyOn(window, 'open').and.returnValue(null);
    component.onPrint();
    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please allow popups to print');
  });

  it('should open print window on successful print', () => {
    const mockWindow = {
      document: { write: jasmine.createSpy('write'), close: jasmine.createSpy('close') },
      print: jasmine.createSpy('print'),
      onafterprint: null as any,
    };
    spyOn(window, 'open').and.returnValue(mockWindow as any);
    component.onPrint();
    expect(mockWindow.document.write).toHaveBeenCalled();
    expect(mockWindow.print).toHaveBeenCalled();
  });
});
