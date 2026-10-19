import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { UnitTestResultsQueryComponent } from './unit-test-results-query';
import { UnitTestResultsQueryService } from './services/unit-test-results-query.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitTestResultResponseDto } from './models/unit-test-results-query.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('UnitTestResultsQueryComponent', () => {
  let component: UnitTestResultsQueryComponent;
  let fixture: ComponentFixture<UnitTestResultsQueryComponent>;
  let unitTestResultsQueryServiceSpy: jasmine.SpyObj<UnitTestResultsQueryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockResponse: UnitTestResultResponseDto = {
    unitId: '1234567',
    donorId: 'DN001',
    collDate: '13-FEB-2024',
    donorName: 'Doe, John',
    dateOfBirth: '01-JAN-1980',
    gender: 'M',
    testResults: [
      {
        testId: 'HTLV-I/II',
        resultCode: 'N',
        formattedResult: 'N',
        absorbance: null,
        cutOff: null,
        bandDetails: null
      },
      {
        testId: 'ABORH',
        resultCode: 'O POS',
        formattedResult: 'O POS',
        absorbance: null,
        cutOff: null,
        bandDetails: null
      }
    ],
    hlaAntigens: {
      a1TestId: 'HLA1',
      a1Result: 'A0201',
      a2TestId: 'HLA2',
      a2Result: 'A0301',
      b1TestId: 'HLA3',
      b1Result: 'B0801',
      b2TestId: 'HLA4',
      b2Result: 'B1501'
    },
    rbcAntigens: [
      {
        groupId: 'D',
        tests: [{ testId: 'D', result: 'POS' }]
      },
      {
        groupId: 'C',
        tests: [{ testId: 'C', result: 'NEG' }]
      }
    ]
  };

  beforeEach(() => {

    unitTestResultsQueryServiceSpy = jasmine.createSpyObj('UnitTestResultsQueryService', [
      'getUnitTestResultsByUnitId',
      'queryUnitTestResults',
      'getCollectionDates'
    ]);
    unitTestResultsQueryServiceSpy.getCollectionDates.and.returnValue(
      of({ success: true, statusCode: 200, data: [{ collDate: '13-FEB-2024' }], total: 1 })
    );
    snackbarServiceSpy = createMockSnackbarService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    menuServiceSpy.findMenuItemByPath.and.returnValue({
      label: 'Unit Test Results Query',
      remarks: 'View test results and donor interdictions associated with a unit.',
      subtitle: ''
    });
    headerServiceSpy = createMockHeaderService();

    unitTestResultsQueryServiceSpy.getUnitTestResultsByUnitId.and.returnValue(
      of({
        success: true,
        statusCode: 200,
        data: [mockResponse],
        total: 1
      })
    );



      TestBed.configureTestingModule({
      imports: [
        UnitTestResultsQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: UnitTestResultsQueryService, useValue: unitTestResultsQueryServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, queryParamMap: { get: () => null } },
            queryParams: of({}),
            params: of({})
          }
        }
      ]
    });


    


      unitTestResultsQueryServiceSpy.getUnitTestResultsByUnitId.calls.reset();


      unitTestResultsQueryServiceSpy.queryUnitTestResults.calls.reset();


      unitTestResultsQueryServiceSpy.getCollectionDates.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


    fixture = TestBed.createComponent(UnitTestResultsQueryComponent);
    component = fixture.componentInstance;


    });
  describe('Retrieve Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should call service with parsed unit ID', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onRetrieve();
      tick();

      expect(unitTestResultsQueryServiceSpy.getUnitTestResultsByUnitId).toHaveBeenCalledWith('1234567');
    }));

    it('should update results on successful API call', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onRetrieve();
      tick();

      expect((component as any).unitTestResults()).toEqual(mockResponse);
      expect((component as any).hasQueried()).toBeTrue();
      expect((component as any).loading()).toBeFalse();
    }));


  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear results and call unitIdField.clear()', () => {
      const clearSpy = jasmine.createSpy('clear');
      (component as any).unitIdField = { isValid: false, parsedUnitId: null, clear: clearSpy, unitIdControl: { value: 'test', enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };

      component.onClear();
      expect(clearSpy).toHaveBeenCalled();
      expect((component as any).unitTestResults()).toBeNull();
      expect((component as any).hasQueried()).toBeFalse();
    });





    it('should enable clear button when results are loaded', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { value: '1234567', enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onRetrieve();
      tick();

      expect((component as any).hasResults()).toBeTrue();
    }));
  });

  describe('Donor Interdictions Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onRetrieve();
      tick();
    }));



    it('should not open panel when no results', () => {
      component.onClear();
      component.openDonorInterdictionsPanel();

      expect((component as any).isInterdictionsPanelOpen()).toBeFalse();
    });

    it('should close panel', () => {
      component.openDonorInterdictionsPanel();
      component.closeDonorInterdictionsPanel();

      expect((component as any).isInterdictionsPanelOpen()).toBeFalse();
      expect((component as any).interdictionsPanelDonorId()).toBeNull();
    });
  });


  describe('RBC Antigens', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onRetrieve();
      tick();
    }));

    it('should display RBC antigens by group', () => {
      const groups = (component as any).rbcAntigensByGroup();

      expect(groups.length).toBe(2);
      expect(groups[0].groupId).toBe('D');
      expect(groups[1].groupId).toBe('C');
    });

    it('should return empty array when no results', () => {
      component.onClear();
      const groups = (component as any).rbcAntigensByGroup();

      expect(groups).toEqual([]);
    });
  });
  describe('Empty State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display correct empty state messages', () => {
      const emptyState = fixture.debugElement.query(By.css('.empty-state-container'));
      const text = emptyState.nativeElement.textContent;

      expect(text).toContain('Unit Test Results Query');
      expect(text).toContain('Scan or enter a Unit ID to view test results');
    });
  });



  describe('Collection Date Picker (Multiple Donations)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show readonly date for single donation', fakeAsync(() => {
      unitTestResultsQueryServiceSpy.getCollectionDates.and.returnValue(
        of({ success: true, statusCode: 200, data: [{ collDate: '13-FEB-2024' }], total: 1 })
      );

      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onUnitValidated({} as any);
      tick();
      fixture.detectChanges();

      expect((component as any).showCollDatePicker()).toBeFalse();
      expect((component as any).displayCollDate()).toBe('13-FEB-2024');
    }));

    it('should show datepicker for multiple donations', fakeAsync(() => {
      unitTestResultsQueryServiceSpy.getCollectionDates.and.returnValue(
        of({ success: true, statusCode: 200, data: [{ collDate: '13-FEB-2024' }, { collDate: '20-MAR-2024' }], total: 2 })
      );

      (component as any).unitIdField = { isValid: true, parsedUnitId: '1234567', clear: jasmine.createSpy(), unitIdControl: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      component.onUnitValidated({} as any);
      tick();
      fixture.detectChanges();

      expect((component as any).showCollDatePicker()).toBeTrue();
    }));






  });
});
