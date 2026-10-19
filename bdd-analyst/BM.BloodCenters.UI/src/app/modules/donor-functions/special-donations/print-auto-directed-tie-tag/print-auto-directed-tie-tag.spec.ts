import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { PrintAutoDirectedTieTagComponent } from './print-auto-directed-tie-tag';
import { PrintAutoDirectedTieTagService } from './services/print-auto-directed-tie-tag.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import type { PatientSearchResultDto } from './models/print-auto-directed-tie-tag.models';

describe('PrintAutoDirectedTieTagComponent', () => {
  let component: PrintAutoDirectedTieTagComponent;
  let fixture: ComponentFixture<PrintAutoDirectedTieTagComponent>;
  let tieTagServiceSpy: jasmine.SpyObj<PrintAutoDirectedTieTagService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockPatients: PatientSearchResultDto[] = [
    {
      patientId: 'PAT001',
      chapterId: '0001',
      lastName: 'Smith',
      firstName: 'John',
      dateOfBirth: '1980-01-15',
      surgeryId: 'SURG001',
      surgeryDate: '2024-01-15',
    },
    {
      patientId: 'PAT002',
      chapterId: '0001',
      lastName: 'Doe',
      firstName: 'Jane',
      dateOfBirth: '1990-05-20',
      surgeryId: 'SURG002',
      surgeryDate: '2024-01-20',
    },
  ];

  beforeEach(() => {

    tieTagServiceSpy = jasmine.createSpyObj('PrintAutoDirectedTieTagService', [
      'getPatients',
      'searchPatients',
      'getTransferDetails',
      'getDonations',
      'getPatientTypes',
      'getAttributes',
      'getPrinters',
      'getIrradiationPrompt',
      'validatePrintRequest',
      'printTieTags',
    ]);

    tieTagServiceSpy.getPatients.and.returnValue(of(mockPatients));
    tieTagServiceSpy.searchPatients.and.returnValue(of(mockPatients));

    const pageHeaderServiceSpy = {
      pageHeaderData: signal(undefined),
      getTitle: () => undefined,
      getSubtitle: () => undefined,
    };

    const headerServiceSpy = {
      chapterChanged$: of(null),
    };

      TestBed.configureTestingModule({
      imports: [PrintAutoDirectedTieTagComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: PrintAutoDirectedTieTagService, useValue: tieTagServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    

      tieTagServiceSpy.getPatients.calls.reset();

      tieTagServiceSpy.searchPatients.calls.reset();

      tieTagServiceSpy.getTransferDetails.calls.reset();

      tieTagServiceSpy.getDonations.calls.reset();

      tieTagServiceSpy.getPatientTypes.calls.reset();

      tieTagServiceSpy.getAttributes.calls.reset();

      tieTagServiceSpy.getPrinters.calls.reset();

      tieTagServiceSpy.getIrradiationPrompt.calls.reset();

      tieTagServiceSpy.validatePrintRequest.calls.reset();

      tieTagServiceSpy.printTieTags.calls.reset();

      tieTagServiceSpy.getPatients.and.returnValue(of(mockPatients));

      tieTagServiceSpy.searchPatients.and.returnValue(of(mockPatients));

    fixture = TestBed.createComponent(PrintAutoDirectedTieTagComponent);
    component = fixture.componentInstance;
    dialogSpy = (component as any).dialog;
    spyOn(dialogSpy, 'open').and.returnValue({
      afterClosed: () => of(null),
    } as MatDialogRef<any>);

    });

  describe('Initialization', () => {

    it('should initialize filter form with default values', () => {
      fixture.detectChanges();
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('patientId')?.value).toBeNull();
      expect(component.filterForm.get('patientSearch')?.value).toBeNull();
      expect(component.filterForm.get('searchOption')?.value).toBe('LIKE');
    });

    it('should load patients on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(tieTagServiceSpy.getPatients).toHaveBeenCalled();
      expect(component.patientOptions().length).toBe(2);
      expect(component.isLoadingPatients).toBeFalse();
    }));

    it('should handle patient load error gracefully', fakeAsync(() => {
      tieTagServiceSpy.getPatients.and.returnValue(
        throwError(() => new Error('Load failed')),
      );
      fixture.detectChanges();
      tick();
      expect(component.patientOptions()).toEqual([]);
      expect(component.isLoadingPatients).toBeFalse();
    }));

  });

  describe('Filter Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have searchOption as required', () => {
      component.filterForm.get('searchOption')?.setValue(null);
      expect(component.filterForm.get('searchOption')?.valid).toBeFalse();
    });

    it('should have two search options', () => {
      expect(component.searchOptions.length).toBe(2);
      expect(component.searchOptions.map(o => o.value)).toEqual([
        'LIKE',
        'EXACT',
      ]);
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });




    it('should set patientId when patient selected from dialog', fakeAsync(() => {
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);
      tieTagServiceSpy.getTransferDetails.and.returnValue(of({
        patientId: 'PAT001', patientName: 'Smith, John', sex: 'M', dateOfBirth: '1980-01-15',
        patientType: null, surgeryId: 'SURG001', surgeryDate: '2024-01-15', surgeryType: null,
        surgeryDescription: null, physicianId: null, physicianName: null, hospitalId: null,
        hospitalName: null, dateNeededBy: null, unitsRequired: null, comments: null, chapterId: '0001',
      }));
      tieTagServiceSpy.getDonations.and.returnValue(of({
        success: true, message: '', statusCode: 200, data: [], warnings: [],
      }));

      tieTagServiceSpy.searchPatients.calls.reset();
      tieTagServiceSpy.searchPatients.and.returnValue(of(mockPatients));
      component.filterForm.get('patientSearch')?.setValue('Smith');
      component.filterForm.get('searchOption')?.setValue('LIKE');
      component.onRetrieve();
      tick();

      afterClosedSubject.next(mockPatients[0]);
      afterClosedSubject.complete();
      tick();

      expect(component.filterForm.get('patientId')?.value).toBe('PAT001');
    }));

    it('should not update form when dialog cancelled', fakeAsync(() => {
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

      tieTagServiceSpy.searchPatients.calls.reset();
      tieTagServiceSpy.searchPatients.and.returnValue(of(mockPatients));
      component.filterForm.get('patientSearch')?.setValue('Smith');
      component.filterForm.get('searchOption')?.setValue('LIKE');
      component.onRetrieve();
      tick();

      afterClosedSubject.next(null);
      afterClosedSubject.complete();
      tick();

      expect(component.filterForm.get('patientId')?.value).toBeNull();
    }));

    it('should set hasRetrievedData on empty EXACT results', fakeAsync(() => {
      tieTagServiceSpy.searchPatients.calls.reset();
      tieTagServiceSpy.searchPatients.and.returnValue(of([]));
      component.filterForm.get('patientSearch')?.setValue('ZZZ');
      component.filterForm.get('searchOption')?.setValue('EXACT');
      component.onRetrieve();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBeTrue();
    }));


    it('should reset page index on retrieve', fakeAsync(() => {
      component.pageIndex = 3;
      tieTagServiceSpy.searchPatients.calls.reset();
      tieTagServiceSpy.searchPatients.and.returnValue(of(mockPatients));
      component.filterForm.get('patientSearch')?.setValue('S');
      component.filterForm.get('searchOption')?.setValue('EXACT');
      component.onRetrieve();
      tick();

      expect(component.pageIndex).toBe(0);
    }));
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });




    it('should reset all state on clear', fakeAsync(() => {
      tieTagServiceSpy.searchPatients.calls.reset();
      tieTagServiceSpy.searchPatients.and.returnValue(of([]));
      component.filterForm.get('patientSearch')?.setValue('S');
      component.onRetrieve();
      tick();

      component.onClearAll();

      expect(component.filterForm.get('patientId')?.value).toBeNull();
      expect(component.filterForm.get('patientSearch')?.value).toBeNull();
      expect(component.filterForm.get('searchOption')?.value).toBe('LIKE');
      expect(component.dataSource).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.hasRetrievedData).toBeFalse();
      expect(component.pageIndex).toBe(0);
    }));
  });

  describe('Patient LOV Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all patients when no search text', () => {
      expect(component.filteredPatients().length).toBe(2);
    });





  });

  describe('Selected Patient Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));


    it('should display only patient ID when selected', () => {
      component.filterForm.get('patientId')?.setValue('PAT001');
      expect(component.selectedPatientDisplay()).toBe('PAT001');
    });

    it('should display just ID when patient not found in options', () => {
      component.filterForm.get('patientId')?.setValue('UNKNOWN');
      expect(component.selectedPatientDisplay()).toBe('UNKNOWN');
    });
  });


  describe('Date Formatting', () => {
    it('should format valid dates as DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2024-01-15');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });



  });
  describe('Tag Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set tagError on all rows without tag selected', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 1, copies2: 0, copies3: 0, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
        { donorId: 'D2', seqNo: '2', unitId: null, chapterId: '0001', collectionDate: null, product1: 'PLT', product2: 'FFP', product3: null, copies1: 1, copies2: 0, copies3: 0, donType: 'AUTO', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      const result = (component as any).validateTagFields();

      expect(result).toBeFalse();
      expect(component.donations[0].tagError).toBeTrue();
      expect(component.donations[1].tagError).toBeFalse();
    });

    it('should pass validation when all rows have tag selected', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 1, copies2: 0, copies3: 0, donType: 'DIR', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      const result = (component as any).validateTagFields();

      expect(result).toBeTrue();
      expect(component.donations[0].tagError).toBeFalse();
    });

    it('should pass validation for rows not being printed', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: null, product2: null, product3: null, copies1: 0, copies2: 0, copies3: 0, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      const result = (component as any).validateTagFields();

      expect(result).toBeTrue();
      expect(component.donations[0].tagError).toBeFalse();
    });

    it('should pass validation for rows not being printed even with tag selected', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: null, product2: null, product3: null, copies1: 0, copies2: 0, copies3: 0, donType: 'AUTO', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      const result = (component as any).validateTagFields();

      expect(result).toBeTrue();
      expect(component.donations[0].tagError).toBeFalse();
    });

    it('should clear tagError when tag is selected via onTagChange', () => {
      const row = { donType: 'AUTO', tagError: true } as any;
      component.onTagChange(row);

      expect(row.tagError).toBeFalse();
    });

    it('should not clear tagError when tag is cleared via onTagChange', () => {
      const row = { donType: '', tagError: true } as any;
      component.onTagChange(row);

      expect(row.tagError).toBeTrue();
    });

    it('should validate all rows and mark multiple errors at once', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 1, copies2: 0, copies3: 0, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
        { donorId: 'D2', seqNo: '2', unitId: null, chapterId: '0001', collectionDate: null, product1: 'PLT', product2: null, product3: null, copies1: 1, copies2: 0, copies3: 0, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
        { donorId: 'D3', seqNo: '3', unitId: null, chapterId: '0001', collectionDate: null, product1: null, product2: null, product3: 'CRYO', copies1: 0, copies2: 0, copies3: 1, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      const result = (component as any).validateTagFields();

      expect(result).toBeFalse();
      expect(component.donations[0].tagError).toBeTrue();
      expect(component.donations[1].tagError).toBeTrue();
      expect(component.donations[2].tagError).toBeTrue();
    });

    it('should not call backend validatePrintRequest when tag validation fails', () => {
      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 1, copies2: 0, copies3: 0, donType: '', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      component.onPrint();

      expect(tieTagServiceSpy.validatePrintRequest).not.toHaveBeenCalled();
      expect(component.donations[0].tagError).toBeTrue();
    });


  });

  describe('Print Success', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all filters and reset state after successful print', fakeAsync(() => {
      const snackbarSpy = (component as any).snackbarService;
      spyOn(snackbarSpy, 'showSuccess');

      component.patientDetails = {
        patientId: 'PAT001', patientName: 'Smith', sex: 'M', dateOfBirth: '1980-01-15',
        patientType: null, surgeryId: 'SURG001', surgeryDate: '2024-01-15', surgeryType: null,
        surgeryDescription: null, physicianId: null, physicianName: null, hospitalId: 'H1',
        hospitalName: null, dateNeededBy: null, unitsRequired: null, comments: null, chapterId: '0001',
      } as any;

      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 0, copies2: 0, copies3: 0, donType: 'AUTO', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      component.filterForm.get('patientId')?.setValue('PAT001');
      component.hasRetrievedData = true;

      tieTagServiceSpy.printTieTags.and.returnValue(of({ success: true, message: 'Tie Tag sent to printer LP01 successfully.', statusCode: 200, data: undefined as any }));

      (component as any).executePrint('LP01');
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Tie Tag sent to printer LP01 successfully.');
      expect(component.patientDetails).toBeNull();
      expect(component.donations).toEqual([]);
      expect(component.filterForm.get('patientId')?.value).toBeNull();
      expect(component.hasRetrievedData).toBeFalse();
    }));

    it('should not throw when print fails — error handled by interceptor', fakeAsync(() => {
      component.patientDetails = {
        patientId: 'PAT001', patientName: 'Smith', sex: 'M', dateOfBirth: '1980-01-15',
        patientType: null, surgeryId: 'SURG001', surgeryDate: '2024-01-15', surgeryType: null,
        surgeryDescription: null, physicianId: null, physicianName: null, hospitalId: 'H1',
        hospitalName: null, dateNeededBy: null, unitsRequired: null, comments: null, chapterId: '0001',
      } as any;

      component.donations = [
        { donorId: 'D1', seqNo: '1', unitId: null, chapterId: '0001', collectionDate: null, product1: 'RBC', product2: null, product3: null, copies1: 0, copies2: 0, copies3: 0, donType: 'AUTO', cmv: 'No', ir: 'No', ifFlag: 'No', tagError: false },
      ] as any[];

      tieTagServiceSpy.printTieTags.and.returnValue(throwError(() => ({ error: { message: 'Print failed' } })));

      expect(() => {
        (component as any).executePrint('LP01');
        tick();
      }).not.toThrow();

      expect(component.patientDetails).not.toBeNull();
    }));
  });
});
