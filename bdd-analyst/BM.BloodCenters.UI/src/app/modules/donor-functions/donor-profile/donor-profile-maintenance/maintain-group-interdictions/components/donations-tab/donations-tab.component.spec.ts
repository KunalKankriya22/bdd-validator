import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DonationsTabComponent } from './donations-tab.component';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { DonationUnit, GroupInterdictionLookupDto, DonationsResponse } from '../../models/maintain-group-interdictions.model';

describe('DonationsTabComponent', () => {
  let component: DonationsTabComponent;
  let fixture: ComponentFixture<DonationsTabComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;
  let snackBarSpy: jasmine.Spy;
  let dialog: MatDialog;

  const mockUnits: DonationUnit[] = [
    { unitId: 'W123418021301-U', displayUnitId: 'W123418021301-UC', driveId: 'DRV0166517', collDate: '2025-01-10', setId: 'BAT0207167', transactionId: 'T1' },
    { unitId: 'W123418021301-S', displayUnitId: 'W123418021301-SC', driveId: 'DRV0166517', collDate: '2025-01-10', setId: 'BAT0207157', transactionId: 'T2' },
    { unitId: 'W123418021301-Q', displayUnitId: 'W123418021301-QC', driveId: 'DRV0166517', collDate: '2025-01-10', setId: 'ONSITE', transactionId: 'T3' },
    { unitId: 'W123418021301-O', displayUnitId: 'W123418021301-OC', driveId: 'DRV0166517', collDate: '2025-01-10', setId: 'BAT0207167', transactionId: 'T4' }
  ];

  const mockDonationsResponse: DonationsResponse = {
    donations: mockUnits,
    totalDonors: 4
  };

  const mockInterdictions: GroupInterdictionLookupDto[] = [
    { code: 'HBCNT', description: 'HBC Testing not done on Lab' }
  ];

  const mockModes: GroupInterdictionLookupDto[] = [
    { code: 'DRIVE', description: 'Drive ID' },
    { code: 'COLL', description: 'Collection Date' },
    { code: 'BATCH', description: 'Batch ID' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getGroupModes', 'getValuesByMode', 'retrieveDonations', 'getExistingInterCodes',
      'placeInterdictions', 'removeInterdictions', 'getValidInterdictions',
      'getInterTypes', 'getTermReasons'
    ]);
    serviceSpy.getGroupModes.and.returnValue(of(mockModes));
    serviceSpy.getValuesByMode.and.returnValue(of([{ code: 'DRV001', description: 'DRV001' }]));
    serviceSpy.retrieveDonations.and.returnValue(of(mockDonationsResponse));
    serviceSpy.getExistingInterCodes.and.returnValue(of(mockInterdictions));
    serviceSpy.placeInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalUnits: 4, totalInterCodes: 1, committed: true
    }));
    serviceSpy.removeInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalUnits: 4, totalInterCodes: 1, committed: true
    }));



      TestBed.configureTestingModule({
imports: [DonationsTabComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy }
      ]
    });


    });



  beforeEach(() => {

      serviceSpy.getGroupModes.and.returnValue(of(mockModes));


      serviceSpy.getValuesByMode.and.returnValue(of([{ code: 'DRV001', description: 'DRV001' }]));


      serviceSpy.retrieveDonations.and.returnValue(of(mockDonationsResponse));


      serviceSpy.getExistingInterCodes.and.returnValue(of(mockInterdictions));


      serviceSpy.placeInterdictions.and.returnValue(of({
    }));


      serviceSpy.removeInterdictions.and.returnValue(of({
    }));


    fixture = TestBed.createComponent(DonationsTabComponent);
    component = fixture.componentInstance;

    dialog = TestBed.inject(MatDialog);
    snackBarSpy = spyOn(component['snackBar'], 'open');

    fixture.detectChanges();


    });


  it('should load group modes from API on init', () => {
    expect(serviceSpy.getGroupModes).toHaveBeenCalled();
    expect(component.modeOptions().length).toBe(3);
    expect(component.modeOptions()[0].code).toBe('DRIVE');
    expect(component.modeOptions()[1].code).toBe('COLL');
    expect(component.modeOptions()[2].code).toBe('BATCH');
  });

  it('should fall back to hardcoded modes if API fails', fakeAsync(() => {
    serviceSpy.getGroupModes.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(DonationsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.modeOptions().length).toBe(2);
  }));

  it('should update description when mode changes', fakeAsync(() => {
    component.controlForm.get('mode')?.setValue('DRIVE');
    tick();
    expect(component.modeDescription()).toBe('Drive ID');
  }));

  it('should load value options when mode changes', fakeAsync(() => {
    component.controlForm.get('mode')?.setValue('DRIVE');
    tick();
    expect(serviceSpy.getValuesByMode).toHaveBeenCalledWith('DRIVE');
    expect(component.valueOptions().length).toBe(1);
  }));



  it('should retrieve donations and interdictions', fakeAsync(() => {
    component.controlForm.get('mode')?.setValue('DRIVE');
    component.controlForm.get('value')?.setValue('DRV001');
    tick();
    component.onRetrieve();
    tick();
    expect(serviceSpy.retrieveDonations).toHaveBeenCalled();
    expect(serviceSpy.getExistingInterCodes).toHaveBeenCalled();
    expect(component.units().length).toBe(4);
    expect(component.interdictions().length).toBe(1);
    expect(component.hasRetrieved()).toBe(true);
    expect(component.isLoading()).toBe(false);
  }));

  it('should show error when no donations found', fakeAsync(() => {
    serviceSpy.retrieveDonations.and.returnValue(of({ donations: [], totalDonors: 0 }));
    component.controlForm.get('mode')?.setValue('DRIVE');
    component.controlForm.get('value')?.setValue('DRV001');
    tick();
    component.onRetrieve();
    tick();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'No donations found for the selected criteria.',
      'DISMISS',
      jasmine.objectContaining({ verticalPosition: 'top' })
    );
  }));






  it('should handle invalid date gracefully', () => {
    const formatted = component.formatDate('invalid');
    expect(formatted).toBe('invalid');
  });



  it('should toggle row selection', () => {
    const interdiction = { code: 'HBCNT', description: 'HBC Testing' };
    component.interdictions.set([interdiction]);

    component.toggleRow(interdiction);
    expect(component.selection.isSelected(interdiction)).toBe(true);
    expect(component.selectedCount()).toBe(1);

    component.toggleRow(interdiction);
    expect(component.selection.isSelected(interdiction)).toBe(false);
    expect(component.selectedCount()).toBe(0);
  });

  it('should toggle all rows', () => {
    const interdictions = [
      { code: 'HBCNT', description: 'HBC Testing' },
      { code: 'DDI', description: 'Deferred Indefinitely' }
    ];
    component.interdictions.set(interdictions);

    component.toggleAllRows();
    expect(component.selectedCount()).toBe(2);
    expect(component.isAllSelected()).toBe(true);

    component.toggleAllRows();
    expect(component.selectedCount()).toBe(0);
    expect(component.isAllSelected()).toBe(false);
  });


  it('should clear selection when clearSelection is called', () => {
    const interdiction = { code: 'HBCNT', description: 'HBC Testing' };
    component.interdictions.set([interdiction]);
    component.toggleRow(interdiction);
    expect(component.selectedCount()).toBe(1);

    component.clearSelection();
    expect(component.selectedCount()).toBe(0);
    expect(component.selection.selected.length).toBe(0);
  });



  it('should call removeInterdictions with all selected codes when dialog confirms', fakeAsync(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, reasonCode: 'ERR', reasonDescription: 'Error' }));
    spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

    component.controlForm.get('mode')?.setValue('DRIVE');
    component.controlForm.get('value')?.setValue('DRV001');
    tick();

    const interdictions = [
      { code: 'HBCNT', description: 'HBC Testing' },
      { code: 'DDI', description: 'Deferred Indefinitely' }
    ];
    component.interdictions.set(interdictions);
    component.toggleRow(interdictions[0]);
    component.toggleRow(interdictions[1]);

    component.onDeleteSelected();
    tick();

    expect(serviceSpy.removeInterdictions).toHaveBeenCalledWith(jasmine.objectContaining({
      interCodes: ['HBCNT', 'DDI'],
      termReason: 'ERR'
    }));
  }));


});
