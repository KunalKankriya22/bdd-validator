import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { PlaceReleaseMultipleUnitInterdiction } from './place-release-multiple-unit-interdiction';
import { PlaceReleaseInterdictionApiService } from './services/place-release-interdiction-api.service';
import { InterdictionRecord, UnitRecord } from './models/place-release-interdiction.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TranslateService } from '@ngx-translate/core';
import { createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import { DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub } from '@shared/testing/component-stubs';

describe('PlaceReleaseMultipleUnitInterdiction', () => {
  let serviceSpy: any;
  let component: PlaceReleaseMultipleUnitInterdiction;
  let componentAny: any;
  let fixture: ComponentFixture<PlaceReleaseMultipleUnitInterdiction>;
  let mockService: jasmine.SpyObj<PlaceReleaseInterdictionApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockInterdictionCodes: InterdictionRecord[] = [
    { interCode: 'AMBI', interType: 'A', interDesc: 'Ambiguous Test' },
    { interCode: 'ABOZ', interType: 'Z', interDesc: 'ABO Discrepancy' },
  ];

  const mockUnits: UnitRecord[] = [
    {
      unitId: 'UNIT001',
      collectionDate: '2007-12-20',
      collDate: '2007-12-20',
    },
    {
      unitId: 'UNIT002',
      collectionDate: '2007-12-21',
      collDate: '2007-12-21',
    },
  ];

  const mockSuccessResult = {
    processedCount: 2,
    skippedCount: 0,
    errors: [],
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('PlaceReleaseInterdictionApiService', [
      'getInterdictionCodes',
      'placeInterdictions',
      'releaseInterdictions',
      'getUnitsForRelease',
    ]);
    const snackbarSpy = createMockSnackbarService();
    const translateSpy = createMockTranslateService();



      TestBed.configureTestingModule({
imports: [
        PlaceReleaseMultipleUnitInterdiction,
        ReactiveFormsModule,
        MatDialogModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        HttpClientTestingModule,
        PageHeaderWithBreadcrumb,
        UnitIdFieldComponent,
        DataTable,
      ],
      providers: [
        { provide: PlaceReleaseInterdictionApiService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PlaceReleaseMultipleUnitInterdiction, {
      remove: { imports: [DataTable, UnitIdFieldComponent, PageHeaderWithBreadcrumb] },
      add: { imports: [DataTableStub, UnitIdFieldStub, PageHeaderWithBreadcrumbStub] },
    });


    });



  beforeEach(() => {


      serviceSpy.getInterdictionCodes.calls.reset();


      serviceSpy.placeInterdictions.calls.reset();


      serviceSpy.releaseInterdictions.calls.reset();


      serviceSpy.getUnitsForRelease.calls.reset();


    mockService = TestBed.inject(
      PlaceReleaseInterdictionApiService
    ) as jasmine.SpyObj<PlaceReleaseInterdictionApiService>;
    mockSnackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(PlaceReleaseMultipleUnitInterdiction);
    component = fixture.componentInstance;
    componentAny = component as any;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {

    it('should initialize with null selectedAction and empty arrays', () => {
      expect(componentAny['selectedAction']()).toBeNull();
      expect(componentAny['interdictionRows']()).toEqual([]);
      expect(componentAny['units']()).toEqual([]);
      expect(componentAny['loading']()).toBeFalse();
      expect(componentAny['error']()).toBeNull();
    });

    it('should have action options PLACE and RELEASE', () => {
      expect(componentAny['actionOptions']).toEqual(['PLACE', 'RELEASE']);
    });
  });

  describe('Action Selection', () => {
    beforeEach(() => {
      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    });

    it('should load interdiction codes when PLACE action is selected', () => {
      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));

      componentAny['actionForm'].patchValue({ action: 'PLACE' });
      fixture.detectChanges();

      expect(componentAny['selectedAction']()).toBe('PLACE');
      expect(mockService.getInterdictionCodes).toHaveBeenCalled();
    });

  });

  describe('Computed Values', () => {
    it('should calculate total interdiction count excluding new rows', () => {
      componentAny['interdictionRows'].set([
        { id: 1, isNew: false, interCode: 'AMBI', interType: 'A', interDesc: 'Ambiguous Test' },
        { id: 2, isNew: true, interCode: '', interType: '', interDesc: '' },
      ]);

      expect(componentAny['totalInterdictionCount']()).toBe(1);
    });

    it('should calculate total unit count', () => {
      componentAny['units'].set(mockUnits);

      expect(componentAny['totalUnitCount']()).toBe(2);
    });

    it('should return true for isEmpty when no action selected', () => {
      expect(componentAny['isEmpty']()).toBeTrue();

      componentAny['selectedAction'].set('PLACE');
      expect(componentAny['isEmpty']()).toBeFalse();
    });

    it('should return false for canCommit when no units', () => {
      expect(componentAny['canCommit']()).toBeFalse();

      componentAny['selectedAction'].set('PLACE');
      componentAny['interdictionRows'].set([
        { id: 1, isNew: false, interCode: 'AMBI', interType: 'A', interDesc: 'Ambiguous Test' },
      ]);
      expect(componentAny['canCommit']()).toBeFalse();

      componentAny['units'].set(mockUnits);
      expect(componentAny['canCommit']()).toBeTrue();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date string correctly', () => {
      const formattedDate = componentAny['formatDate']('2007-12-20');
      expect(formattedDate).toBe('20-DEC-2007');
    });


  });

  describe('Clear All', () => {
    it('should clear all interdictions, units, reset action dropdown, and mark form as untouched', () => {
      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));

      componentAny['actionForm'].patchValue({ action: 'PLACE' });
      componentAny['actionForm'].markAsTouched();
      componentAny['actionForm'].markAsDirty();
      componentAny['interdictionRows'].set([
        { id: 1, isNew: false, interCode: 'AMBI', interType: 'A', interDesc: 'Ambiguous Test' },
      ]);
      componentAny['units'].set(mockUnits);

      componentAny['onClearAll']();

      expect(componentAny['interdictionRows']()).toEqual([]);
      expect(componentAny['units']()).toEqual([]);
      expect(componentAny['actionForm'].value.action).toBeNull();
      expect(componentAny['selectedAction']()).toBeNull();
      expect(componentAny['actionForm'].touched).toBeFalse();
      expect(componentAny['actionForm'].pristine).toBeTrue();
      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('All data cleared.');
    });
  });

  describe('Commit with Partial Success', () => {
    beforeEach(() => {
      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
      componentAny['actionForm'].patchValue({ action: 'PLACE' });
      componentAny['interdictionRows'].set([
        { id: 1, isNew: false, interCode: 'AMBI', interType: 'A', interDesc: 'Ambiguous Test' },
      ]);
      componentAny['units'].set(mockUnits);
    });


    it('should handle multiple error messages', () => {
      const partialResult = {
        processedCount: 0,
        skippedCount: 2,
        errors: [
          'Error Code: 5001 Unit validation failed',
          'Error Code: 5002 Interdiction already exists'
        ],
      };
      mockService.placeInterdictions.and.returnValue(of(partialResult));

      componentAny['onCommit']();

      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('Successfully placed 0 interdiction(s). 2 failed.');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error Code: 5001 Unit validation failed');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error Code: 5002 Interdiction already exists');
    });

    it('should reset form to untouched state after successful commit', () => {
      mockService.placeInterdictions.and.returnValue(of(mockSuccessResult));

      componentAny['actionForm'].markAsTouched();
      componentAny['onCommit']();

      expect(componentAny['actionForm'].value.action).toBeNull();
      expect(componentAny['actionForm'].touched).toBeFalse();
      expect(componentAny['actionForm'].pristine).toBeTrue();
    });
  });

  describe('Error Code Format', () => {

    it('should format API error codes without parentheses', () => {
      mockService.getInterdictionCodes.and.returnValue(
        throwError(() => ({ error: { errorCode: 9001, message: 'Database error' } }))
      );

      componentAny['actionForm'].patchValue({ action: 'PLACE' });
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error Code: 9001 Failed to load active interdictions');
    });
  });
});
