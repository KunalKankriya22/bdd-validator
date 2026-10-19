import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DonorsTabComponent } from './donors-tab.component';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { DonorRecord, GroupInterdictionLookupDto, DonorsResponse } from '../../models/maintain-group-interdictions.model';

describe('DonorsTabComponent', () => {
  let component: DonorsTabComponent;
  let fixture: ComponentFixture<DonorsTabComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;
  let snackBarSpy: jasmine.Spy;
  let dialog: MatDialog;
  let dialogSpy: jasmine.Spy;

  const mockDonors: DonorRecord[] = [
    { donorId: 'DN63946724', donorName: 'Walker, Jason', unitId: 'W123418021301-U', transactionId: 'T1' },
    { donorId: 'DN63946234', donorName: 'Hines, Nick', unitId: 'W123418021301-S', transactionId: 'T2' },
    { donorId: 'DN63941280', donorName: 'Bower, Christopher', unitId: 'W123418021301-Q', transactionId: 'T3' },
    { donorId: 'DN63946745', donorName: 'Gillis, Cole', unitId: 'W123418021301-O', transactionId: 'T4' }
  ];

  const mockDonorsResponse: DonorsResponse = {
    donors: mockDonors,
    totalDonors: 4
  };

  const mockInterdictions: GroupInterdictionLookupDto[] = [
    { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' }
  ];

  const mockModes: GroupInterdictionLookupDto[] = [
    { code: 'DRIVE', description: 'Drive ID' },
    { code: 'COLL', description: 'Collection Date' },
    { code: 'BATCH', description: 'Batch ID' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getDonorGroupModes', 'getDonorGroupValues', 'retrieveDonors',
      'placeDonorInterdictions', 'removeDonorInterdictions', 'getValidInterdictions',
      'getInterTypes', 'getDonorTermReasons', 'getExistingDonorInterCodes',
      'getDonorInterTypes', 'getValidDonorInterdictions'
    ]);
    serviceSpy.getDonorGroupModes.and.returnValue(of(mockModes));
    serviceSpy.getDonorGroupValues.and.returnValue(of([{ code: 'DRV001', description: 'DRV001' }]));
    serviceSpy.retrieveDonors.and.returnValue(of(mockDonorsResponse));
    serviceSpy.placeDonorInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalDonors: 4, totalInterCodes: 1
    }));
    serviceSpy.removeDonorInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalDonors: 4, totalInterCodes: 1
    }));
    serviceSpy.getExistingDonorInterCodes.and.returnValue(of(mockInterdictions));



      TestBed.configureTestingModule({
imports: [DonorsTabComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy }
      ]
    });


    });



  beforeEach(() => {

      serviceSpy.getDonorGroupModes.and.returnValue(of(mockModes));


      serviceSpy.getDonorGroupValues.and.returnValue(of([{ code: 'DRV001', description: 'DRV001' }]));


      serviceSpy.retrieveDonors.and.returnValue(of(mockDonorsResponse));


      serviceSpy.placeDonorInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalDonors: 4, totalInterCodes: 1
    }));


      serviceSpy.removeDonorInterdictions.and.returnValue(of({
      results: [], successCount: 1, failureCount: 0, totalDonors: 4, totalInterCodes: 1
    }));


      serviceSpy.getExistingDonorInterCodes.and.returnValue(of(mockInterdictions));


    fixture = TestBed.createComponent(DonorsTabComponent);
    component = fixture.componentInstance;

    dialog = TestBed.inject(MatDialog);
    snackBarSpy = spyOn(component['snackBar'], 'open');

    // Mock dialog.open to automatically confirm
    dialogSpy = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true)
    } as any);

    fixture.detectChanges();


    });


  it('should initialize with "Both" as default type', () => {
    expect(component.controlForm.get('type')?.value).toBe('B');
  });

  it('should load donor group modes from API on init', () => {
    expect(serviceSpy.getDonorGroupModes).toHaveBeenCalled();
    expect(component.modeOptions().length).toBe(3);
    expect(component.modeOptions()[0].code).toBe('DRIVE');
    expect(component.modeOptions()[1].code).toBe('COLL');
    expect(component.modeOptions()[2].code).toBe('BATCH');
  });

  it('should fall back to hardcoded modes if API fails', fakeAsync(() => {
    serviceSpy.getDonorGroupModes.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(DonorsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.modeOptions().length).toBe(2);
    flush(); // Flush debounceTime timer from setupValueSearch
  }));

  it('should load value options when mode changes', fakeAsync(() => {
    component.controlForm.patchValue({ mode: 'DRIVE' });
    tick();

    expect(serviceSpy.getDonorGroupValues).toHaveBeenCalledWith('DRIVE');
    expect(component.valueOptions().length).toBe(1);
    expect(component.isLoadingValues()).toBe(false);
  }));

  it('should update mode description when mode changes', fakeAsync(() => {
    component.controlForm.patchValue({ mode: 'DRIVE' });
    tick();

    // Mode description includes the full label from mode options
    expect(component.modeDescription()).toBe('Drive ID');
  }));

  it('should reset value and results when mode changes', fakeAsync(() => {
    component.donors.set(mockDonors);
    component.hasRetrieved.set(true);

    component.controlForm.patchValue({ mode: 'DRIVE' });
    tick();

    expect(component.controlForm.get('value')?.value).toBe('');
    expect(component.hasRetrieved()).toBe(false);
    expect(component.donors().length).toBe(0);
  }));

  it('should handle value loading error gracefully', fakeAsync(() => {
    serviceSpy.getDonorGroupValues.and.returnValue(throwError(() => new Error('API error')));

    component.controlForm.patchValue({ mode: 'DRIVE' });
    tick();

    expect(component.valueOptions().length).toBe(0);
    expect(component.filteredValueOptions().length).toBe(0);
    expect(component.isLoadingValues()).toBe(false);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to load values. Please try again.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    flush(); // Flush snackbar timer
  }));

  it('should retrieve donors successfully', fakeAsync(() => {
    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.onRetrieve();
    tick();

    expect(serviceSpy.retrieveDonors).toHaveBeenCalledWith({
      groupMode: 'DRIVE',
      groupValue: 'DRV001',
      deferralChoice: 'N'
    });
    expect(component.donors().length).toBe(4);
    expect(component.hasRetrieved()).toBe(true);
    expect(component.isLoading()).toBe(false);
  }));

  it('should handle empty donor results', fakeAsync(() => {
    serviceSpy.retrieveDonors.and.returnValue(of({ donors: [], totalDonors: 0 }));

    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.onRetrieve();
    tick();

    expect(component.donors().length).toBe(0);
    expect(component.hasRetrieved()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(snackBarSpy).not.toHaveBeenCalled();
  }));

  it('should handle retrieve error gracefully', fakeAsync(() => {
    serviceSpy.retrieveDonors.and.returnValue(throwError(() => new Error('API error')));

    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.onRetrieve();
    tick();

    expect(component.isLoading()).toBe(false);
    expect(component.hasRetrieved()).toBe(true);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to retrieve data. Please try again.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    flush(); // Flush snackbar timer
  }));

  it('should not submit form if invalid', () => {
    component.controlForm.patchValue({ mode: '', value: '', type: 'B' });
    component.onRetrieve();

    expect(serviceSpy.retrieveDonors).not.toHaveBeenCalled();
    expect(component.controlForm.touched).toBe(true);
  });





  it('should handle null/undefined code when sorting', () => {
    const interdictionsWithNulls: GroupInterdictionLookupDto[] = [
      { code: 'B', description: 'Second' },
      { code: undefined as any, description: 'No Code' },
      { code: 'A', description: 'First' }
    ];
    component.interdictions.set(interdictionsWithNulls);

    // Should not throw error
    const sorted = component.filteredInterdictions();
    expect(sorted.length).toBe(3);
    expect(sorted[0].description).toBe('No Code'); // Empty string sorts first
    expect(sorted[1].code).toBe('A');
    expect(sorted[2].code).toBe('B');
  });


  it('should initialize value search control', () => {
    expect(component.valueSearchControl).toBeDefined();
    expect(component.valueSearchControl.value).toBe('');
  });

  it('should expose Math for template usage', () => {
    expect(component.Math).toBe(Math);
    expect(component.Math.min(100, 50)).toBe(50);
  });



  it('should have correct deferral choice options', () => {
    expect(component.deferralChoiceOptions.length).toBe(3);
    expect(component.deferralChoiceOptions[0].code).toBe('D');
    expect(component.deferralChoiceOptions[1].code).toBe('N');
    expect(component.deferralChoiceOptions[2].code).toBe('B');
  });



  it('should place interdictions successfully', fakeAsync(() => {
    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.donors.set(mockDonors);

    component.onInterdictionsSelected([
      { interCode: 'PHYTD', interDesc: 'Physical Findings Temporary Deferral', effDate: '', termDate: '', viewLevel: 1, selected: true }
    ]);
    tick();

    expect(serviceSpy.placeDonorInterdictions).toHaveBeenCalledWith({
      groupMode: 'DRIVE',
      groupValue: 'DRV001',
      deferralChoice: 'N',
      interCodes: ['PHYTD']
    });
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Interdictions placed successfully. 1 of 4 donor(s) processed.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
    flush(); // Flush snackbar timer
  }));

  it('should handle place interdictions failure and show error message', fakeAsync(() => {
    serviceSpy.placeDonorInterdictions.and.returnValue(of({
      results: [
        { donorId: 'DN00007789', interCode: '102D', errorMessage: 'Err47. Interdiction not on donor, chk insert date ORA-01403: no data found' },
        { donorId: 'DN30130383', interCode: '102D', errorMessage: 'Err47. Interdiction not on donor, chk insert date ORA-01403: no data found' },
        { donorId: 'DN30130384', interCode: '102D', errorMessage: 'Err47. Interdiction not on donor, chk insert date ORA-01403: no data found' }
      ],
      successCount: 1,
      failureCount: 3,
      totalDonors: 4,
      totalInterCodes: 1
    }));

    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.onInterdictionsSelected([
      { interCode: 'PHYTD', interDesc: 'Physical Findings Temporary Deferral', effDate: '', termDate: '', viewLevel: 1, selected: true }
    ]);
    tick();

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Partial success: 1 of 4 interdiction(s) placed successfully, 3 failed. Check individual donor results for details.',
      'DISMISS',
      jasmine.objectContaining({
        panelClass: ['error-snackbar'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      })
    );
    // Verify no duration was set (persistent error)
    const snackBarConfig = snackBarSpy.calls.mostRecent().args[2];
    expect(snackBarConfig.duration).toBeUndefined();
    flush();
  }));

  it('should toggle row selection and update selectedCount', () => {
    const interdiction: GroupInterdictionLookupDto = { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' };
    component.interdictions.set([interdiction]);

    component.toggleRow(interdiction);
    expect(component.selection.isSelected(interdiction)).toBe(true);
    expect(component.selectedCount()).toBe(1);

    component.toggleRow(interdiction);
    expect(component.selection.isSelected(interdiction)).toBe(false);
    expect(component.selectedCount()).toBe(0);
  });

  it('should toggle all rows', () => {
    const interdictions: GroupInterdictionLookupDto[] = [
      { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' },
      { code: 'DDI', description: 'Deferred Indefinitely' }
    ];
    component.interdictions.set(interdictions);

    component.toggleAllRows();
    expect(component.selectedCount()).toBe(2);
    expect(component.isAllSelected()).toBe(true);

    component.toggleAllRows();
    expect(component.selectedCount()).toBe(0);
  });


  it('should call removeDonorInterdictions with all selected codes when dialog confirms', fakeAsync(() => {
    dialogSpy.and.returnValue({
      afterClosed: () => of({ confirmed: true, reasonCode: 'REASON1' })
    } as any);

    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });

    const interdictions: GroupInterdictionLookupDto[] = [
      { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' },
      { code: 'DDI', description: 'Deferred Indefinitely' }
    ];
    component.interdictions.set(interdictions);
    component.toggleRow(interdictions[0]);
    component.toggleRow(interdictions[1]);

    component.onDeleteSelected();
    tick();

    expect(serviceSpy.removeDonorInterdictions).toHaveBeenCalledWith(jasmine.objectContaining({
      interCodes: ['PHYTD', 'DDI'],
      termReason: 'REASON1'
    }));
    flush();
  }));


  it('should not close comments panel when bulk-deleted codes do not include the viewed one', fakeAsync(() => {
    const viewedInterdiction: GroupInterdictionLookupDto = { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' };
    const deletedInterdiction: GroupInterdictionLookupDto = { code: 'OTHER', description: 'Other Interdiction' };
    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.selectedInterdictionForComments = viewedInterdiction;
    component.showCommentsPanel = true;
    component.interdictions.set([viewedInterdiction, deletedInterdiction]);
    component.toggleRow(deletedInterdiction);

    dialogSpy.and.returnValue({
      afterClosed: () => of({ confirmed: true, reasonCode: 'REASON1' })
    } as any);

    component.onDeleteSelected();
    tick();

    expect(component.showCommentsPanel).toBe(true);
    expect(component.selectedInterdictionForComments).toBe(viewedInterdiction);
    flush();
  }));

  it('should not close comments panel when deletion is cancelled', fakeAsync(() => {
    const interdiction: GroupInterdictionLookupDto = { code: 'PHYTD', description: 'Physical Findings Temporary Deferral' };
    component.controlForm.patchValue({ mode: 'DRIVE', value: 'DRV001', type: 'N' });
    component.selectedInterdictionForComments = interdiction;
    component.showCommentsPanel = true;
    component.interdictions.set([interdiction]);
    component.toggleRow(interdiction);

    dialogSpy.and.returnValue({
      afterClosed: () => of(null)
    } as any);

    component.onDeleteSelected();
    tick();

    expect(component.showCommentsPanel).toBe(true);
    expect(component.selectedInterdictionForComments).toBe(interdiction);
  }));


});
