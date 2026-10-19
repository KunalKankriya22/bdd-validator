import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import moment from 'moment';

import { MaintainValidEquipmentQcDataComponent } from './maintain-valid-equipment-qc-data.component';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { EquipmentQcDataService } from './services/equipment-qc-data.service';
import { createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  EquipmentQcFilterCriteria,
  EquipmentQcDataResponse,
  EquipmentQcRow
} from './models/equipment-qc-data.model';

describe('MaintainValidEquipmentQcDataComponent', () => {
  let chapterTimezoneSpy: any;
  let component: MaintainValidEquipmentQcDataComponent;
  let fixture: ComponentFixture<MaintainValidEquipmentQcDataComponent>;
  let equipmentQcDataServiceSpy: jasmine.SpyObj<EquipmentQcDataService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockRows: EquipmentQcRow[] = [
    {
      seqNo: '100',
      description: 'Test QC 1',
      units: 'CHAR',
      targetValue: '100',
      minAccept: '90',
      maxAccept: '110',
      effectiveDate: '2025-01-01',
      terminationDate: null
    }
  ];

  const mockResponse: EquipmentQcDataResponse = {
    masterData: {
      qcId: 'ID-000001',
      reviewRequired: '1',
      reviewRequiredDescription: 'No review of QC required',
      frequency: null,
      qcPeriod: 'V',
      qcPeriodDesc: 'Variable',
      effectiveDate: '2018-03-06',
      terminationDate: '2030-12-31',
      requiredForClarification: 'N',
      createWorksheet: 'Y'
    },
    rows: mockRows,
    totalRecords: 1
  };

  beforeEach(() => {

    equipmentQcDataServiceSpy = jasmine.createSpyObj('EquipmentQcDataService', [
      'retrieveEquipmentQcData',
      'saveEquipmentQcData',
      'getEquipmentTypes',
      'getQcTypes',
      'getReviewRequired',
      'getQcPerformedEvery',
      'getUnits'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    equipmentQcDataServiceSpy.retrieveEquipmentQcData.and.returnValue(of(mockResponse));
    equipmentQcDataServiceSpy.saveEquipmentQcData.and.returnValue(of(true));
    equipmentQcDataServiceSpy.getEquipmentTypes.and.returnValue(of([]));
    equipmentQcDataServiceSpy.getQcTypes.and.returnValue(of([]));
    equipmentQcDataServiceSpy.getReviewRequired.and.returnValue(of([]));
    equipmentQcDataServiceSpy.getQcPerformedEvery.and.returnValue(of([]));
    equipmentQcDataServiceSpy.getUnits.and.returnValue(of([]));

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment('2025-01-01'));



      TestBed.configureTestingModule({
      imports: [MaintainValidEquipmentQcDataComponent, NoopAnimationsModule],
      providers: [
        { provide: EquipmentQcDataService, useValue: equipmentQcDataServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        provideNativeDateAdapter()
      ]
    })
    .overrideComponent(MaintainValidEquipmentQcDataComponent, {
      set: {
        providers: [
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: MatDialog, useValue: dialogSpy }
        ]
      }
    });


    


      equipmentQcDataServiceSpy.retrieveEquipmentQcData.calls.reset();


      equipmentQcDataServiceSpy.saveEquipmentQcData.calls.reset();


      equipmentQcDataServiceSpy.getEquipmentTypes.calls.reset();


      equipmentQcDataServiceSpy.getQcTypes.calls.reset();


      equipmentQcDataServiceSpy.getReviewRequired.calls.reset();


      equipmentQcDataServiceSpy.getQcPerformedEvery.calls.reset();


      equipmentQcDataServiceSpy.getUnits.calls.reset();


      dialogSpy.open.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      equipmentQcDataServiceSpy.retrieveEquipmentQcData.and.returnValue(of(mockResponse));


      equipmentQcDataServiceSpy.saveEquipmentQcData.and.returnValue(of(true));


      equipmentQcDataServiceSpy.getEquipmentTypes.and.returnValue(of([]));


      equipmentQcDataServiceSpy.getQcTypes.and.returnValue(of([]));


      equipmentQcDataServiceSpy.getReviewRequired.and.returnValue(of([]));


      equipmentQcDataServiceSpy.getQcPerformedEvery.and.returnValue(of([]));


      equipmentQcDataServiceSpy.getUnits.and.returnValue(of([]));


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment('2025-01-01'));


    fixture = TestBed.createComponent(MaintainValidEquipmentQcDataComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should have empty initial state', () => {
      fixture.detectChanges();
      expect(component['equipmentQcData']()).toEqual([]);
      expect(component['totalRecords']()).toBe(0);
      expect(component['loading']()).toBe(false);
      expect(component['dataLoaded']()).toBe(false);
    });



    it('should display correct subtitle', () => {
      fixture.detectChanges();
      const subtitle = fixture.debugElement.query(By.css('.page-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Define and maintain equipment quality control parameters and schedules.');
    });

    it('should display breadcrumb navigation', () => {
      fixture.detectChanges();
      const breadcrumb = fixture.debugElement.query(By.css('.breadcrumb'));
      expect(breadcrumb).toBeTruthy();
      expect(breadcrumb.nativeElement.textContent).toContain('Home');
    });

    it('should initialize master form', () => {
      fixture.detectChanges();
      expect(component.masterForm).toBeTruthy();
      expect(component.masterForm.get('reviewRequired')).toBeTruthy();
      expect(component.masterForm.get('qcPeriod')).toBeTruthy();
    });

    it('should load lookup data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(equipmentQcDataServiceSpy.getReviewRequired).toHaveBeenCalled();
      expect(equipmentQcDataServiceSpy.getQcPerformedEvery).toHaveBeenCalled();
    }));
  });

  describe('Data Retrieval', () => {
    it('should retrieve data when filter criteria is provided', fakeAsync(() => {
      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      fixture.detectChanges();
      component.onRetrieve(criteria);
      tick();

      expect(equipmentQcDataServiceSpy.retrieveEquipmentQcData).toHaveBeenCalled();
      expect(component['equipmentQcData']().length).toBe(1);
      expect(component['totalRecords']()).toBe(1);
      expect(component['dataLoaded']()).toBe(true);
    }));





    it('should handle retrieval errors', fakeAsync(() => {
      equipmentQcDataServiceSpy.retrieveEquipmentQcData.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      fixture.detectChanges();
      component.onRetrieve(criteria);
      tick();

      expect(component['loading']()).toBe(false);
      expect(component['error']()).toBeTruthy();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Clear Functionality', () => {
    it('should reset state on clear', fakeAsync(() => {
      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      fixture.detectChanges();
      component.onRetrieve(criteria);
      tick();

      component.onCleared();

      expect(component['dataLoaded']()).toBe(false);
      expect(component['equipmentQcData']()).toEqual([]);
      expect(component['totalRecords']()).toBe(0);
    }));
  });

  describe('Pagination', () => {
    it('should handle page change events', fakeAsync(() => {
      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      fixture.detectChanges();
      component.onRetrieve(criteria);
      tick();

      const pageEvent = { pageIndex: 1, pageSize: 25, length: 100 } as any;
      component.onPageChange(pageEvent);
      tick();

      expect(equipmentQcDataServiceSpy.retrieveEquipmentQcData).toHaveBeenCalledTimes(2);
      expect(component['paginationConfig'].pageIndex).toBe(1);
      expect(component['paginationConfig'].pageSize).toBe(25);
    }));
  });

  describe('Save Functionality', () => {
    it('should save with master form values when form is valid', fakeAsync(() => {
      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      fixture.detectChanges();
      component.onRetrieve(criteria);
      tick();

      // Master form is populated from response which sets reviewRequired, qcPeriod, requiredForClarification, effectiveDate
      expect(component.masterForm.valid).toBe(true);

      component.masterForm.markAsDirty();
      component.onSave();
      tick();

      expect(equipmentQcDataServiceSpy.saveEquipmentQcData).toHaveBeenCalled();
      const saveCall = equipmentQcDataServiceSpy.saveEquipmentQcData.calls.mostRecent().args[0];
      expect(saveCall.equipmentType).toBe('EQ1');
      expect(saveCall.qcType).toBe('QC1');
    }));

    it('should show error when saving without filter criteria', () => {
      fixture.detectChanges();
      component.masterForm.patchValue({
        reviewRequired: '1',
        qcPeriod: 'V',
        effectiveDate: moment('2025-01-01'),
        requiredForClarification: 'N',
        createWorksheet: 'Y'
      });
      component.masterForm.markAsDirty();

      component.onSave();

      expect(equipmentQcDataServiceSpy.saveEquipmentQcData).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Cannot save: Equipment Type and QC Type are required'
      );
    });

    it('should handle save errors', fakeAsync(() => {
      equipmentQcDataServiceSpy.saveEquipmentQcData.and.returnValue(
        throwError(() => new Error('Save failed'))
      );

      const criteria: EquipmentQcFilterCriteria = {
        equipmentType: 'EQ1',
        qcType: 'QC1'
      };

      component['currentFilter'].set(criteria);
      fixture.detectChanges();

      component.masterForm.patchValue({
        reviewRequired: '1',
        qcPeriod: 'V',
        effectiveDate: moment('2025-01-01'),
        requiredForClarification: 'N',
        createWorksheet: 'Y'
      });

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['loading']()).toBe(false);
    }));
  });
  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      component['error'].set('Test error message');
      component['loading'].set(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    });


  });
  describe('Date Formatting', () => {
    it('should format dates for API correctly', () => {
      const formattedDate = component['formatDateForApi']('2025-01-15');
      expect(formattedDate).toBe('2025-01-15');
    });


  });
});
