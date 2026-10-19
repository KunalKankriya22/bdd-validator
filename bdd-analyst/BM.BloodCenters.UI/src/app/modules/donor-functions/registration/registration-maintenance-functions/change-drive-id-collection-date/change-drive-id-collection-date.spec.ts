import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import moment from 'moment';
import { ChangeDriveIdCollectionDateComponent } from './change-drive-id-collection-date';
import { ChangeDriveIdCollectionDateService } from './services/change-drive-id-collection-date.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonationRecord, RetrieveResponse } from './models/change-drive-id-collection-date.model';
import { UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ChangeDriveIdCollectionDateComponent', () => {
  let snackBarSpy: any;
  let component: ChangeDriveIdCollectionDateComponent;
  let fixture: ComponentFixture<ChangeDriveIdCollectionDateComponent>;
  let changeDriveServiceSpy: jasmine.SpyObj<ChangeDriveIdCollectionDateService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDonation: DonationRecord = {
    unitId: 'W11012377531',
    deferralId: '',
    transactionId: 'TR02867047',
    collectionDate: '2024-01-11',
    donationType: 'ALL',
    procedureCode: 'WB',
    auditFlag: 'Y',
    driveId: 'DRV0166517',
    chapterId: 'CH01',
    programId: 'PROG01',
    setId: 'SET001',
    insertDate: '2024-01-10'
  };

  const mockRetrieveResponse: RetrieveResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [mockDonation],
    total: 1,
    errorResponse: { errorCode: '', error: '' }
  };

  const notFoundResponse: RetrieveResponse = {
    success: false,
    message: 'Not found',
    statusCode: 404,
    data: [],
    total: 0,
    errorResponse: { errorCode: '', error: '' }
  };

  function makePostValidateEvent(parsedUnitId: string): {
    event: UnitIdPostValidateEvent;
    confirmSpy: jasmine.Spy;
    rejectSpy: jasmine.Spy;
  } {
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event: UnitIdPostValidateEvent = {
      data: { parsedUnitId } as UnitValidationResponse,
      confirm: confirmSpy,
      reject: rejectSpy
    };
    return { event, confirmSpy, rejectSpy };
  }

  function simulateFullValidation(paginatedIndex: number, parsedUnitId: string): void {
    const { event } = makePostValidateEvent(parsedUnitId);
    component.onUnitPostValidate(event, paginatedIndex);
    tick();
    component.onUnitValidated({ parsedUnitId } as UnitValidationResponse, paginatedIndex);
    fixture.detectChanges();
  }

  beforeEach(() => {

    const chapterChanged$ = new Subject<void>();

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable', 'getChapterLocalDate'
    ]);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    changeDriveServiceSpy = jasmine.createSpyObj('ChangeDriveIdCollectionDateService', [
      'getDonationTypes',
      'getProcedureCodes',
      'getByUnitId',
      'getByDeferralId',
      'getByDriveId',
      'getDrivesByDate',
      'updateDrive',
      'getUpdteDrivParam'
    ]);

    headerServiceSpy = createMockHeaderService({ chapterId: signal('CH01') });

    changeDriveServiceSpy.getDonationTypes.and.returnValue(of([
      { code: 'ALL', description: 'All Types' },
      { code: 'WB', description: 'Whole Blood' }
    ]));
    changeDriveServiceSpy.getProcedureCodes.and.returnValue(of([
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PLT', description: 'Platelets' }
    ]));
    changeDriveServiceSpy.getDrivesByDate.and.returnValue(of({ data: [], success: true } as any));
    changeDriveServiceSpy.getByUnitId.and.returnValue(of(mockRetrieveResponse));
    changeDriveServiceSpy.getUpdteDrivParam.and.returnValue(of({ data: { value: 30, description: 'Days' }, success: true }));
      TestBed.configureTestingModule({
imports: [
        ChangeDriveIdCollectionDateComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ChangeDriveIdCollectionDateService, useValue: changeDriveServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });


    });



  beforeEach(() => {
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      changeDriveServiceSpy.getDonationTypes.and.returnValue(of([


      changeDriveServiceSpy.getProcedureCodes.and.returnValue(of([


      changeDriveServiceSpy.getDrivesByDate.and.returnValue(of({ data: [], success: true } as any));


      changeDriveServiceSpy.getByUnitId.and.returnValue(of(mockRetrieveResponse));


      changeDriveServiceSpy.getUpdteDrivParam.and.returnValue(of({ data: { value: 30, description: 'Days' }, success: true }));
    fixture = TestBed.createComponent(ChangeDriveIdCollectionDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {
    it('should initialize with search form containing only newDate and newDrive', () => {
      expect(component.searchForm.get('newDate')?.value).toBeNull();
      expect(component.searchForm.get('newDrive')?.value).toBe('');
      expect(component.searchForm.get('unitId')).toBeNull();
      expect(component.searchForm.get('deferralId')).toBeNull();
    });


    it('should start with one pending row by default', () => {
      expect(component.donationsArray.length).toBe(1);
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeTrue();
    });
  });

  describe('onUnitPostValidate', () => {
    it('should confirm and store pending data when unit ID is found', fakeAsync(() => {
      const { event, confirmSpy, rejectSpy } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 0);
      tick();

      expect(changeDriveServiceSpy.getByUnitId).toHaveBeenCalledWith('W11012377531', 'CH01');
      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    }));

    it('should reject when unit ID is not found (no deferral fallback)', fakeAsync(() => {
      changeDriveServiceSpy.getByUnitId.and.returnValue(of(notFoundResponse));

      const { event, rejectSpy } = makePostValidateEvent('INVALID001');
      component.onUnitPostValidate(event, 0);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit ID not found.');
      expect(changeDriveServiceSpy.getByDeferralId).not.toHaveBeenCalled();
    }));

    it('should confirm when deferral ID is found with Deferral ID type selected', fakeAsync(() => {
      // Set ID type to DEFERRAL_ID
      component.searchForm.get('idType')?.setValue('DEFERRAL_ID');
      component.selectedIdType.set('DEFERRAL_ID');
      changeDriveServiceSpy.getByDeferralId.and.returnValue(of(mockRetrieveResponse));

      const { event, confirmSpy } = makePostValidateEvent('DEF001');
      component.onUnitPostValidate(event, 0);
      tick();

      expect(changeDriveServiceSpy.getByDeferralId).toHaveBeenCalledWith('DEF001', 'CH01');
      expect(changeDriveServiceSpy.getByUnitId).not.toHaveBeenCalled();
      expect(confirmSpy).toHaveBeenCalled();
    }));

    it('should reject when unit ID lookup errors', fakeAsync(() => {
      changeDriveServiceSpy.getByUnitId.and.returnValue(throwError(() => new Error('Network error')));

      const { event, rejectSpy } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 0);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit ID not found.');
    }));

    it('should reject immediately when paginatedIndex is out of bounds', () => {
      const { event, rejectSpy } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 99);

      expect(rejectSpy).toHaveBeenCalledWith('Row not found');
      expect(changeDriveServiceSpy.getByUnitId).not.toHaveBeenCalled();
    });

    it('should reject duplicate unit IDs that are already validated', fakeAsync(() => {
      // Validate first row
      simulateFullValidation(0, 'W11012377531');

      // Add second pending row and try same ID
      component.addNewUnit();
      fixture.detectChanges();

      const { event: event2, rejectSpy: reject2 } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event2, 1);
      tick();

      expect(reject2).toHaveBeenCalledWith('This Unit/Deferral ID has already been added.');
      expect(changeDriveServiceSpy.getByUnitId.calls.count()).toBe(1);
    }));
  });

  describe('onUnitValidated', () => {
    it('should populate row with donation data after post-validate confirms', fakeAsync(() => {
      const { event } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 0);
      tick();

      component.onUnitValidated({ parsedUnitId: 'W11012377531' } as UnitValidationResponse, 0);

      const row = component.donationsArray.at(0);
      expect(row.get('isPending')?.value).toBeFalse();
      expect(row.get('unitDeferralId')?.value).toBe('W11012377531');
      expect(row.get('transactionId')?.value).toBe('TR02867047');
      expect(row.get('driveId')?.value).toBe('DRV0166517');
    }));

    it('should do nothing when no pending data exists for the given unit ID', () => {
      component.onUnitValidated({ parsedUnitId: 'W11012377531' } as UnitValidationResponse, 99);
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeTrue();
    });

    it('should do nothing when no pending data exists for index', fakeAsync(() => {
      // Call validated without a preceding postValidate confirm
      component.onUnitValidated({ parsedUnitId: 'W11012377531' } as UnitValidationResponse, 0);
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeTrue();
    }));

    it('should track validated unit ID to prevent duplicates', fakeAsync(() => {
      simulateFullValidation(0, 'W11012377531');

      component.addNewUnit();
      fixture.detectChanges();

      const { event, rejectSpy } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 1);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('This Unit/Deferral ID has already been added.');
    }));
  });

  describe('addNewUnit', () => {
    it('should add a new pending row', () => {
      const initial = component.donationsArray.length;
      component.addNewUnit();
      expect(component.donationsArray.length).toBe(initial + 1);
      expect(component.donationsArray.at(initial).get('isPending')?.value).toBeTrue();
    });

    it('should increment totalRecords', () => {
      const initial = component.totalRecords();
      component.addNewUnit();
      expect(component.totalRecords()).toBe(initial + 1);
    });
  });

  describe('Table Operations', () => {
    beforeEach(fakeAsync(() => {
      simulateFullValidation(0, 'W11012377531');
    }));

    it('should have validated row after full validation flow', () => {
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeFalse();
    });


    it('should decrement totalRecords on delete', () => {
      const before = component.totalRecords();
      component.deleteRow(0);
      expect(component.totalRecords()).toBe(Math.max(0, before - 1));
    });


    it('should filter donations by table search text', () => {
      component.onTableSearch('W11012377531');
      expect(component.tableSearchText()).toBe('W11012377531');
    });





    it('should return unfold_more for inactive column', () => {
      expect(component.getSortIcon('collectionDate')).toBe('unfold_more');
    });
  });

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      simulateFullValidation(0, 'W11012377531');
    }));


    it('should save successfully with new drive and include correct transaction IDs', fakeAsync(() => {
      changeDriveServiceSpy.updateDrive.and.returnValue(of({ data: { message: 'Success', updatedCount: 1 }, success: true }));

      component.searchForm.patchValue({ newDrive: 'DRV001' });
      component.onSave();
      tick();

      expect(changeDriveServiceSpy.updateDrive).toHaveBeenCalled();
      const request = changeDriveServiceSpy.updateDrive.calls.mostRecent().args[0];
      expect(request.transactionIds).toEqual(['TR02867047']);
      expect(request.newDriveId).toBe('DRV001');
    }));

    it('should show single-unit success message for one unit', fakeAsync(() => {
      changeDriveServiceSpy.updateDrive.and.returnValue(of({ data: { message: 'Success', updatedCount: 1 }, success: true }));
      snackBarSpy = spyOn(component['snackBar'], 'open');

      component.searchForm.patchValue({ newDrive: 'DRV001' });
      component.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Drive ID for unit W11012377531 has been updated successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));



    it('should not include pending rows in transactionIds', fakeAsync(() => {
      changeDriveServiceSpy.updateDrive.and.returnValue(of({ data: { message: 'Success', updatedCount: 1 }, success: true }));
      component.addNewUnit(); // adds a second pending (unvalidated) row

      component.searchForm.patchValue({ newDrive: 'DRV001' });
      component.onSave();
      tick();

      const request = changeDriveServiceSpy.updateDrive.calls.mostRecent().args[0];
      expect(request.transactionIds).toEqual(['TR02867047']);
    }));
  });

  describe('Cancel / Clear', () => {
    it('should reset all data and keep one pending row on cancel', fakeAsync(() => {
      simulateFullValidation(0, 'W11012377531');
      component.addNewUnit();

      component.onCancel();

      expect(component.donationsArray.length).toBe(1);
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeTrue();
      expect(component.searchForm.get('newDate')?.value).toBeNull();
      expect(component.searchForm.get('newDrive')?.value).toBeFalsy();
    }));

  });

  describe('Pagination', () => {


    it('should populate the correct row when page changes between post-validate and validated', fakeAsync(() => {
      // Use page size 1 so page 0 = donationsArray[0], page 1 = donationsArray[1]
      component.pageSize.set(1);
      fixture.detectChanges();

      // Start validation for row 0 on page 0
      const { event } = makePostValidateEvent('W11012377531');
      component.onUnitPostValidate(event, 0);
      tick(); // API returns → pendingDonationData keyed with actualIndex=0

      // Add a second row and navigate to page 1 (user paged while API was in-flight)
      component.addNewUnit();
      fixture.detectChanges();
      component.onPageChange({ pageIndex: 1, pageSize: 1, length: 2 });
      fixture.detectChanges();

      // onUnitValidated fires — page has changed so paginatedDonations()[0] is now row 1
      // The Map lookup must use parsedUnitId, not the current page position
      component.onUnitValidated({ parsedUnitId: 'W11012377531' } as UnitValidationResponse, 0);
      fixture.detectChanges();

      // Original row (actualIndex 0) must be populated — NOT the current page's row 1
      expect(component.donationsArray.at(0).get('isPending')?.value).toBeFalse();
      expect(component.donationsArray.at(0).get('unitDeferralId')?.value).toBe('W11012377531');
      // Row added after page change must remain untouched
      expect(component.donationsArray.at(1).get('isPending')?.value).toBeTrue();
    }));
  });

  describe('Date Formatting', () => {
    it('should format ISO date string to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2024-01-15')).toBe('15-JAN-2024');
    });

    it('should format moment object correctly', () => {
      expect(component.formatDate(moment('2024-06-01'))).toBe('01-JUN-2024');
    });


  });
});
