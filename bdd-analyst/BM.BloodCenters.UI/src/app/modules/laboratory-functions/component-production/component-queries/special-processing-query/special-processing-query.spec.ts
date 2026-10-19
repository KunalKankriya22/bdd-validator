import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SpecialProcessingQueryComponent } from './special-processing-query';
import { SpecialProcessingQueryService } from './services/special-processing-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockPageHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ReturnResult,
  SpecialProcessingQueryResultDto,
  SpecialProcessingRecordDto,
} from './models/special-processing-query.model';

describe('SpecialProcessingQueryComponent', () => {
  let component: SpecialProcessingQueryComponent;
  let fixture: ComponentFixture<SpecialProcessingQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<SpecialProcessingQueryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChanged$: Subject<unknown>;

  const mockRecord: SpecialProcessingRecordDto = {
    unitId: '12345678',
    collDate: '2026-06-01',
    chapterId: 'CH01',
    productCode: 'RBC',
    componentPrefix: '01',
    processCode: 'SP01',
    processCodeDescription: 'Special Processing Type 1',
    insertDate: '2026-06-02T10:30:00',
    insertUserId: 'USER01',
    linkUnitId: 'LINK001',
    differentials: [
      {
        differentialId: 1,
        stageCode: 'STG1',
        insertDate: '2026-06-02T10:30:00',
        insertUserId: 'USER01',
        details: [
          { cellCode: 'WBC', cellCodeDescription: 'White Blood Cells', cellCount: 100 },
          { cellCode: 'RBC', cellCodeDescription: 'Red Blood Cells', cellCount: 5000 },
        ],
      },
    ],
    reagents: [
      {
        kitId: 101,
        stageCode: 'STG1',
        insertDate: '2026-06-02T11:00:00',
        insertUserId: 'USER01',
        details: [
          {
            reagentName: 'Reagent A',
            manufacturer: 'Manufacturer X',
            lotNumber: 'LOT123',
            expirationDate: '2027-06-01',
          },
        ],
      },
    ],
    spiking: [
      {
        spikingType: 'TYPE1',
        insertDate: '2026-06-02T12:00:00',
        insertUserId: 'USER01',
        bagLotNumber: 'BAG001',
        filterLotNumber: 'FLT001',
        bagsSpiked: 4,
        bagsForComponents: 3,
        bagsUsed: 2,
      },
    ],
  };

  const mockSuccessResponse: ReturnResult<SpecialProcessingQueryResultDto> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        unitId: '12345678',
        chapterId: 'CH01',
        collDate: '2026-06-01',
        checkDigit: '01',
        specialProcessingRecords: [mockRecord],
      },
    ],
    total: 1,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('SpecialProcessingQueryService', ['search']);
    snackbarServiceSpy = createMockSnackbarService();
    chapterChanged$ = new Subject();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ label: 'Special Processing Query' });



      TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: SpecialProcessingQueryService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(SpecialProcessingQueryComponent, {
        set: {
          imports: [
            CommonModule,
            ReactiveFormsModule,
            MatButtonModule,
            MatIconModule,
            MatProgressSpinnerModule,
          ],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      });
      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ label: 'Special Processing Query' });


    fixture = TestBed.createComponent(SpecialProcessingQueryComponent);
    component = fixture.componentInstance;


    });
  describe('Unit Validation', () => {
    it('should call API and load data on valid unit ID', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();

      expect(apiServiceSpy.search).toHaveBeenCalledWith('12345678');
      expect(component.hasResults()).toBeTrue();
      expect(component.collectionDateDisplay()).toBe('2026-06-01');
      expect(component.productRecords().length).toBe(1);
    }));





    it('should auto-select first product on successful search', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();

      expect(component.selectedProductIndex()).toBe(0);
      expect(component.selectedRecord()).toEqual(mockRecord);
    }));
  });

  describe('Error Handling', () => {






    it('should handle API errors gracefully', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();

      expect(component.isLoading()).toBeFalse();
      expect(component.hasResults()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Product Selection', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();
    }));

    it('should select a product by index', () => {
      component.selectProduct(0);
      expect(component.selectedProductIndex()).toBe(0);
      expect(component.isProductSelected(0)).toBeTrue();
      expect(component.isProductSelected(1)).toBeFalse();
    });




  });

  describe('Stage Navigation', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();
    }));



    it('should select a stage by index', () => {
      component.selectStage(0);
      expect(component.selectedStageIndex()).toBe(0);
      expect(component.selectedStage()).toBeTruthy();
      expect(component.selectedStage()!.stageCode).toBe('STG1');
    });

    it('should show differential details for selected stage', () => {
      component.selectStage(0);
      expect(component.selectedStage()!.details.length).toBe(2);
      expect(component.selectedStage()!.details[0].cellCode).toBe('WBC');
      expect(component.selectedStage()!.details[0].cellCount).toBe(100);
    });




  });

  describe('Reagent Navigation', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();
    }));



    it('should select a reagent stage by index', () => {
      component.selectStage(0);
      expect(component.selectedStageIndex()).toBe(0);
      expect(component.selectedReagentHeader()).toBeTruthy();
      expect(component.selectedReagentHeader()!.details.length).toBe(1);
      expect(component.selectedReagentHeader()!.details[0].reagentName).toBe('Reagent A');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all results', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();

      expect(component.hasResults()).toBeTrue();

      component.onUnitCleared();

      expect(component.hasResults()).toBeFalse();
      expect(component.productRecords()).toEqual([]);
      expect(component.collectionDateDisplay()).toBe('');
      expect(component.selectedProductIndex()).toBe(-1);
    }));
  });

  describe('Chapter Change', () => {
    it('should clear results on chapter change', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(mockSuccessResponse));
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: '12345678',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '12345678',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();
      expect(component.hasResults()).toBeTrue();

      chapterChanged$.next({});

      expect(component.hasResults()).toBeFalse();
      expect(component.productRecords()).toEqual([]);
    }));
  });

  describe('Date Formatting', () => {


    it('should format datetime as DD-MMM-YYYY HH:mm', () => {
      const result = component.formatDateTime('2026-06-02T10:30:00');
      expect(result).toBe('02-JUN-2026 10:30');
    });






  });
});
