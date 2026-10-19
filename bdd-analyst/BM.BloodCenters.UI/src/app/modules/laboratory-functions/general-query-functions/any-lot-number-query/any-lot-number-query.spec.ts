import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AnyLotNumberQueryComponent } from './any-lot-number-query';
import { AnyLotNumberQueryService } from './services/any-lot-number-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { LotUnitRow } from './models/any-lot-number-query.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AnyLotNumberQueryComponent', () => {
  let component: AnyLotNumberQueryComponent;
  let fixture: ComponentFixture<AnyLotNumberQueryComponent>;
  let mockService: jasmine.SpyObj<AnyLotNumberQueryService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterSubject: Subject<void>;
  let snackBarSpy: jasmine.Spy;

  const mockLotTypes = [
    { bagCode: '01', codeDesc: 'Bag with no anticoagulant' },
    { bagCode: '51', codeDesc: 'Single CPD' },
  ];

  const mockLotNumbers = [
    { lotNumber: 'CPD45C', vendorName: 'Vendor A', dateReceived: '2023-01-01' },
    { lotNumber: '123', vendorName: null, dateReceived: null },
  ];

  const mockUnits: LotUnitRow[] = [
    {
      unitId: 'W633311080613',
      collDate: '2011-08-06T00:00:00',
      sourceTable: 'UNITS',
      components: [
        { productCode: 'E2940V00', componentStatus: 'Lab', systemLabelDecision: 'O Pos', aboLabel: 'O Positive', destination: 'IN STOCK' },
        { productCode: 'E2940V01', componentStatus: 'Lab', systemLabelDecision: null, aboLabel: null, destination: 'IN STOCK' },
      ],
    },
    {
      unitId: 'W633312041977',
      collDate: '2012-05-19T00:00:00',
      sourceTable: 'UNITS',
      components: [],
    },
  ];

  beforeEach(() => {

    chapterSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('AnyLotNumberQueryService', [
      'getLotTypes',
      'getLotNumbers',
      'queryByLotNumber',
    ]);
    mockService.getLotTypes.and.returnValue(of(mockLotTypes));
    mockService.getLotNumbers.and.returnValue(of(mockLotNumbers));
    mockService.queryByLotNumber.and.returnValue(of({ units: mockUnits, totalUnits: 2 }));

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
    const mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Any Lot Number Query', subtitle: 'Review information about lots used.' }),
    });

    TestBed.configureTestingModule({
      imports: [
        AnyLotNumberQueryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnyLotNumberQueryService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
      ],
    });

    mockService.getLotTypes.and.returnValue(of(mockLotTypes));
    mockService.getLotNumbers.and.returnValue(of(mockLotNumbers));
    mockService.queryByLotNumber.and.returnValue(of({ units: mockUnits, totalUnits: 2 }));

    fixture = TestBed.createComponent(AnyLotNumberQueryComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = spyOn(snackBar, 'open');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load lot types on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(mockService.getLotTypes).toHaveBeenCalled();
    expect(component.lotTypes.length).toBe(2);
    expect(component.filteredLotTypes.length).toBe(2);
  }));

  describe('Lot Type change', () => {
    it('should load lot numbers when lot type is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.onLotTypeChange();
      tick();

      expect(mockService.getLotNumbers).toHaveBeenCalledWith('51');
      expect(component.lotNumbers.length).toBe(2);
      expect(component.filteredLotNumbers.length).toBe(2);
    }));

    it('should reset form state on lot type change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.units = mockUnits;
      component.hasSearched = true;
      component.recordCount = 2;

      component.onLotTypeChange();

      expect(component.selectedLotNumber).toBeNull();
      expect(component.units.length).toBe(0);
      expect(component.components.length).toBe(0);
      expect(component.recordCount).toBeNull();
      expect(component.hasSearched).toBeFalse();
    }));

    it('should not call getLotNumbers when lot type is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getLotNumbers.calls.reset();

      component.selectedLotType = null;
      component.onLotTypeChange();
      tick();

      expect(mockService.getLotNumbers).not.toHaveBeenCalled();
      expect(component.lotNumbers.length).toBe(0);
    }));

    it('should show error snackbar when getLotNumbers fails', fakeAsync(() => {
      mockService.getLotNumbers.and.returnValue(throwError(() => ({ error: { message: 'Lot numbers failed' } })));

      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.onLotTypeChange();
      tick();

      expect(component.lotNumbers.length).toBe(0);
      expect(component.filteredLotNumbers.length).toBe(0);
      expect(snackBarSpy).toHaveBeenCalled();
    }));
  });

  describe('Lot Number change', () => {
    it('should execute query when both lot type and number are selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(mockService.queryByLotNumber).toHaveBeenCalledWith({
        lotType: '51',
        lotNumber: 'CPD45C',
      });
    }));

    it('should not execute query when lot type is not selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.queryByLotNumber.calls.reset();

      component.selectedLotType = null;
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(mockService.queryByLotNumber).not.toHaveBeenCalled();
    }));

    it('should not execute query when lot number is not selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.queryByLotNumber.calls.reset();

      component.selectedLotType = '51';
      component.selectedLotNumber = null;
      component.onLotNumberChange();
      tick();

      expect(mockService.queryByLotNumber).not.toHaveBeenCalled();
    }));
  });

  describe('Query execution', () => {
    it('should populate units and record count on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(component.units.length).toBe(2);
      expect(component.recordCount).toBe(2);
      expect(component.hasSearched).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should auto-select first unit components on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(component.components.length).toBe(2);
      expect(component.components[0].productCode).toBe('E2940V00');
    }));

    it('should handle query error gracefully', fakeAsync(() => {
      mockService.queryByLotNumber.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(component.units.length).toBe(0);
      expect(component.recordCount).toBe(0);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle empty units response', fakeAsync(() => {
      mockService.queryByLotNumber.and.returnValue(of({ units: [], totalUnits: 0 }));

      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(component.units.length).toBe(0);
      expect(component.components.length).toBe(0);
      expect(component.recordCount).toBe(0);
    }));

    it('should set isLoading true during query', fakeAsync(() => {
      let loadingDuringCall = false;
      mockService.queryByLotNumber.and.callFake(() => {
        loadingDuringCall = component.isLoading;
        return of({ units: mockUnits, totalUnits: 2 });
      });

      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(loadingDuringCall).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Unit row selection', () => {
    it('should show components of clicked unit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();
      fixture.detectChanges();

      component.onUnitRowClick(mockUnits[0]);

      expect(component.components.length).toBe(2);
      expect(component.components[0].productCode).toBe('E2940V00');
      expect(component.components[1].productCode).toBe('E2940V01');
    }));

    it('should show empty components for unit with no components', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();
      fixture.detectChanges();

      component.onUnitRowClick(mockUnits[1]);

      expect(component.components.length).toBe(0);
    }));
  });

  describe('Chapter change', () => {
    it('should reset form and reload lot types on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.units = mockUnits;
      component.hasSearched = true;
      chapterSubject.next();
      tick();

      expect(component.selectedLotType).toBeNull();
      expect(component.selectedLotNumber).toBeNull();
      expect(component.units.length).toBe(0);
      expect(component.hasSearched).toBeFalse();
      expect(mockService.getLotTypes).toHaveBeenCalled();
    }));
  });

  describe('Date formatting', () => {
    it('should format valid date as DD-MMM-YYYY', () => {
      const result = component['formatDateDisplay']('2011-08-06T00:00:00');
      expect(result).toBe('06-AUG-2011');
    });

    it('should return dash for null value', () => {
      const result = component['formatDateDisplay'](null);
      expect(result).toBe('-');
    });

    it('should return dash for empty string', () => {
      const result = component['formatDateDisplay']('');
      expect(result).toBe('-');
    });

    it('should return dash for invalid date', () => {
      const result = component['formatDateDisplay']('not-a-date');
      expect(result).toBe('-');
    });
  });

  describe('Dropdown search filtering', () => {
    it('should filter lot types by bagCode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.lotTypeSearchControl.setValue('51');
      tick();

      expect(component.filteredLotTypes.length).toBe(1);
      expect(component.filteredLotTypes[0].bagCode).toBe('51');
    }));

    it('should filter lot types by codeDesc', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.lotTypeSearchControl.setValue('wafer');
      tick();

      expect(component.filteredLotTypes.length).toBe(0);
    }));

    it('should filter lot types case-insensitively', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.lotTypeSearchControl.setValue('SINGLE');
      tick();

      expect(component.filteredLotTypes.length).toBe(1);
      expect(component.filteredLotTypes[0].bagCode).toBe('51');
    }));

    it('should filter lot numbers by lotNumber', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.onLotTypeChange();
      tick();

      component.lotNumberSearchControl.setValue('CPD');
      tick();

      expect(component.filteredLotNumbers.length).toBe(1);
      expect(component.filteredLotNumbers[0].lotNumber).toBe('CPD45C');
    }));

    it('should show all items when search is cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.lotTypeSearchControl.setValue('51');
      tick();
      expect(component.filteredLotTypes.length).toBe(1);

      component.lotTypeSearchControl.setValue('');
      tick();
      expect(component.filteredLotTypes.length).toBe(2);
    }));
  });

  describe('Error handling', () => {
    it('should show snackbar when getLotTypes fails', fakeAsync(() => {
      mockService.getLotTypes.and.returnValue(throwError(() => ({ error: { message: 'Lot types failed' } })));

      fixture.detectChanges();
      tick();

      expect(component.lotTypes.length).toBe(0);
      expect(component.filteredLotTypes.length).toBe(0);
      expect(snackBarSpy).toHaveBeenCalled();
    }));

    it('should use fallback message when error has no message', fakeAsync(() => {
      mockService.getLotTypes.and.returnValue(throwError(() => ({})));

      fixture.detectChanges();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'An error occurred while retrieving lot types.',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 })
      );
    }));

    it('should show snackbar when query fails with custom message', fakeAsync(() => {
      mockService.queryByLotNumber.and.returnValue(throwError(() => ({ error: { message: 'Custom error' } })));

      fixture.detectChanges();
      tick();

      component.selectedLotType = '51';
      component.selectedLotNumber = 'CPD45C';
      component.onLotNumberChange();
      tick();

      expect(snackBarSpy).toHaveBeenCalled();
    }));
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    }));
  });
});
