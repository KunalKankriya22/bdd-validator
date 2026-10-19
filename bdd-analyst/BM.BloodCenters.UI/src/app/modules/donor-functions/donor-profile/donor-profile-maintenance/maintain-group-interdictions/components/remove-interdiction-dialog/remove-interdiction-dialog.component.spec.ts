import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RemoveInterdictionDialogComponent } from './remove-interdiction-dialog.component';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { RemoveInterdictionDialogData } from '../../models/maintain-group-interdictions.model';

describe('RemoveInterdictionDialogComponent', () => {
  let mockReasons: any;
  let component: RemoveInterdictionDialogComponent;
  let fixture: ComponentFixture<RemoveInterdictionDialogComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RemoveInterdictionDialogComponent>>;

  const mockDialogData: RemoveInterdictionDialogData = {
    interdictionCode: 'PHYTD',
    interdictionDescription: 'Physical Findings Temporary Deferral'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getTermReasons',
      'getDonorTermReasons'
    ]);
    mockReasons = [
      { code: 'ERR', description: 'Error in placement' },
      { code: 'REQ', description: 'Per request' }
    ];
    serviceSpy.getTermReasons.and.returnValue(of(mockReasons));
    serviceSpy.getDonorTermReasons.and.returnValue(of(mockReasons));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
imports: [RemoveInterdictionDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getTermReasons.calls.reset();


      serviceSpy.getDonorTermReasons.calls.reset();


      dialogRefSpy.close.calls.reset();


      serviceSpy.getTermReasons.and.returnValue(of(mockReasons));


      serviceSpy.getDonorTermReasons.and.returnValue(of(mockReasons));


    fixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should load termination reasons on init', () => {
    expect(serviceSpy.getTermReasons).toHaveBeenCalled();
    expect(component.reasons().length).toBe(2);
  });

  it('should have invalid form initially', () => {
    expect(component.reasonForm.invalid).toBe(true);
  });

  it('should become valid when reason is selected', () => {
    component.reasonForm.get('reasonCode')?.setValue('ERR');
    expect(component.reasonForm.valid).toBe(true);
  });

  it('should update description when reason changes', () => {
    component.reasonForm.get('reasonCode')?.setValue('ERR');
    expect(component.selectedReasonDescription()).toBe('Error in placement');
  });





});

describe('RemoveInterdictionDialogComponent - Donor Context', () => {
  let component: RemoveInterdictionDialogComponent;
  let fixture: ComponentFixture<RemoveInterdictionDialogComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RemoveInterdictionDialogComponent>>;

  const donorDialogData: RemoveInterdictionDialogData = {
    interdictionCode: 'PHYTD',
    interdictionDescription: 'Physical Findings Temporary Deferral',
    context: 'donor'
  };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getTermReasons',
      'getDonorTermReasons'
    ]);
    const mockReasons = [
      { code: 'ERR', description: 'Error in placement' },
      { code: 'REQ', description: 'Per request' }
    ];
    serviceSpy.getTermReasons.and.returnValue(of(mockReasons));
    serviceSpy.getDonorTermReasons.and.returnValue(of(mockReasons));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [RemoveInterdictionDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: donorDialogData }
      ]
    });

    fixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call getDonorTermReasons when context is donor', () => {
    expect(serviceSpy.getDonorTermReasons).toHaveBeenCalled();
    expect(component.reasons().length).toBe(2);
  });

  it('should have context set to donor', () => {
    expect(component.context).toBe('donor');
  });
});
